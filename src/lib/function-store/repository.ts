import * as v from 'valibot';

import {CopyFunction} from '../function';
import {copyFunctionSchema} from '../function.schema';
import {splitIntoShards} from './catalog';
import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
  isFunctionStoreV1Key,
  newId as defaultNewId,
} from './keys';
import {
  CatalogRoot,
  CatalogShard,
  catalogRootSchema,
  catalogShardSchema,
  FunctionDocument,
  functionDocumentSchema,
  looseActivePointerSchema,
} from './schema';
import {
  EFFECTIVE_ITEM_BYTES,
  EFFECTIVE_MAX_ITEMS,
  EFFECTIVE_TOTAL_BYTES,
  MAX_FUNCTIONS,
  itemByteSize,
  totalByteSize,
} from './size';
import {KeyValueStorage, Unsubscribe} from './storage';
import {
  ConflictError,
  CopyFunctionRef,
  CorruptionError,
  QuotaError,
  UnsupportedVersionError,
  ValidationError,
  refFromFunction,
} from './types';

export const SNAPSHOT_CACHE_KEY = 'cocopy:function-store:cache';

/** Items younger than this are never collected (docs: Garbage Collection). */
export const GC_GRACE_MS = 10 * 60 * 1000;

export interface FunctionRepository {
  list(): Promise<CopyFunctionRef[]>;
  listForUrl(url: string): Promise<CopyFunctionRef[]>;
  get(ref: CopyFunctionRef): Promise<CopyFunction | undefined>;
  create(fn: CopyFunction): Promise<void>;
  /**
   * Replaces the stored function that has `fn.id`. When `baseDocumentId` is
   * given (the documentId the caller loaded the function with), the update is
   * refused with a ConflictError if the stored entry has moved on — so an
   * editor opened before another window's save does not silently overwrite it.
   */
  update(fn: CopyFunction, baseDocumentId?: string): Promise<void>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
  subscribe(listener: () => void): Unsubscribe;
  /**
   * Best-effort orphan collection. Also started fire-and-forget after every
   * successful commit; exposed so tests can run it deterministically.
   */
  gc(): Promise<void>;
}

export interface CreateFunctionRepositoryOptions {
  /** Source of truth: storage.sync on Chrome/Firefox, storage.local on Safari. */
  storage: KeyValueStorage;
  /** storage.local used for the validated snapshot cache. Omit to disable caching. */
  cache?: KeyValueStorage;
  now?: () => Date;
  newId?: () => string;
  /** Called once when the Active Pointer is missing, to run migration. */
  onMissingActivePointer?: () => Promise<void>;
}

const snapshotCacheSchema = v.strictObject({
  formatVersion: v.literal(1),
  catalogId: v.string(),
  root: catalogRootSchema,
  shards: v.array(catalogShardSchema),
});

interface Snapshot {
  catalogId: string;
  root: CatalogRoot;
  shards: CatalogShard[];
  entries: CopyFunctionRef[];
}

function parseOrThrow<TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
  what: string,
): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, value);
  if (!result.success) {
    throw new CorruptionError(
      `${what} failed schema validation: ${result.issues[0]?.message ?? 'unknown issue'}`,
    );
  }
  return result.output;
}

function compilePattern(pattern: string | null | undefined): RegExp | null {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function refsEqual(a: CopyFunctionRef, b: CopyFunctionRef): boolean {
  return (
    a.id === b.id &&
    a.documentId === b.documentId &&
    a.name === b.name &&
    a.pattern === b.pattern &&
    a.version === b.version &&
    a.theme.textColor === b.theme.textColor &&
    a.theme.backgroundColor === b.theme.backgroundColor
  );
}

function entriesOf(
  root: CatalogRoot,
  shards: CatalogShard[],
): CopyFunctionRef[] {
  const byId = new Map(shards.map(shard => [shard.shardId, shard]));
  const entries: CopyFunctionRef[] = [];
  for (const shardId of root.shardIds) {
    const shard = byId.get(shardId);
    if (!shard) {
      // Accepting a partial entry list here would let a later mutation commit
      // a catalog that silently drops functions.
      throw new CorruptionError(
        `Catalog Shard ${shardId} referenced by the Root is missing.`,
      );
    }
    entries.push(...shard.entries);
  }
  return entries;
}

/** Rejects a catalog whose shards disagree with the root or repeat an id. */
function validateSnapshotIntegrity(
  catalogId: string,
  root: CatalogRoot,
  shards: CatalogShard[],
): CopyFunctionRef[] {
  if (root.catalogId !== catalogId) {
    throw new CorruptionError(
      `Catalog Root ${root.catalogId} does not match the Active Pointer's catalogId ${catalogId}.`,
    );
  }
  for (const shard of shards) {
    if (shard.catalogId !== catalogId) {
      throw new CorruptionError(
        `Catalog Shard ${shard.shardId} belongs to catalog ${shard.catalogId}, not ${catalogId}.`,
      );
    }
  }

  const entries = entriesOf(root, shards);
  const ids = new Set<string>();
  const documentIds = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new CorruptionError(
        `Duplicate function id "${entry.id}" in catalog.`,
      );
    }
    if (documentIds.has(entry.documentId)) {
      throw new CorruptionError(
        `Duplicate documentId "${entry.documentId}" in catalog.`,
      );
    }
    ids.add(entry.id);
    documentIds.add(entry.documentId);
  }
  return entries;
}

export function createFunctionRepository(
  options: CreateFunctionRepositoryOptions,
): FunctionRepository {
  const {storage, cache} = options;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? defaultNewId;
  const onMissingActivePointer = options.onMissingActivePointer;

  // Mutations are serialized on a promise chain so concurrent callers in the
  // same context never interleave two commit protocols.
  let mutationQueue: Promise<unknown> = Promise.resolve();
  let migrationPromise: Promise<void> | undefined;

  const listeners = new Set<() => void>();
  let storageUnsubscribe: Unsubscribe | undefined;
  // Last catalogId observed by the notification path; used to suppress the
  // duplicate notification our own commit's storage event would produce.
  let notifiedCatalogId: string | undefined;

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = mutationQueue.then(task, task);
    // Keep the chain alive regardless of task outcome.
    mutationQueue = run.catch(() => undefined);
    return run;
  }

  async function readPointerValue(): Promise<string | undefined> {
    const raw = await storage.get([ACTIVE_POINTER_KEY]);
    const value = raw[ACTIVE_POINTER_KEY];
    if (value === undefined) return undefined;

    const parsed = v.safeParse(looseActivePointerSchema, value);
    if (!parsed.success) {
      throw new CorruptionError('Active Pointer failed schema validation.');
    }
    if (parsed.output.formatVersion > 1) {
      throw new UnsupportedVersionError(
        `Active Pointer uses storage format version ${parsed.output.formatVersion}, which this version of cocopy cannot read. Update the extension.`,
        parsed.output.formatVersion,
      );
    }
    if (parsed.output.formatVersion !== 1) {
      // The keys we would read are v1-prefixed; a pointer claiming another
      // version cannot describe them.
      throw new CorruptionError(
        `Active Pointer declares formatVersion ${parsed.output.formatVersion} but the store uses v1 keys.`,
      );
    }
    return parsed.output.catalogId;
  }

  /**
   * Reads the Active Pointer, running the migration hook once if it is absent.
   * The hook is single-flight but deliberately NOT put on the mutation queue:
   * this is reached from inside enqueued mutations, where enqueueing again
   * would deadlock. Migration only runs while no pointer exists, and a commit
   * requires a pointer, so the two can never interleave.
   */
  async function requirePointer(): Promise<string> {
    const catalogId = await readPointerValue();
    if (catalogId !== undefined) return catalogId;

    if (onMissingActivePointer) {
      migrationPromise ??= onMissingActivePointer();
      await migrationPromise;
      const afterMigration = await readPointerValue();
      if (afterMigration !== undefined) return afterMigration;
    }

    throw new CorruptionError(
      'Active Pointer is missing; the function store has not been initialized.',
    );
  }

  async function readCachedSnapshot(): Promise<Snapshot | undefined> {
    if (!cache) return undefined;
    let raw: Record<string, unknown>;
    try {
      raw = await cache.get([SNAPSHOT_CACHE_KEY]);
    } catch {
      return undefined;
    }
    const value = raw[SNAPSHOT_CACHE_KEY];
    if (value === undefined) return undefined;

    const parsed = v.safeParse(snapshotCacheSchema, value);
    if (!parsed.success) return undefined;

    try {
      const entries = validateSnapshotIntegrity(
        parsed.output.catalogId,
        parsed.output.root,
        parsed.output.shards,
      );
      return {
        catalogId: parsed.output.catalogId,
        root: parsed.output.root,
        shards: parsed.output.shards,
        entries,
      };
    } catch {
      return undefined;
    }
  }

  // Skip rewriting the cache for a snapshot generation it already holds.
  let lastCachedCatalogId: string | undefined;

  async function writeCachedSnapshot(snapshot: Snapshot): Promise<void> {
    if (!cache) return;
    if (snapshot.catalogId === lastCachedCatalogId) return;
    try {
      await cache.set({
        [SNAPSHOT_CACHE_KEY]: {
          formatVersion: 1,
          catalogId: snapshot.catalogId,
          root: snapshot.root,
          shards: snapshot.shards,
        },
      });
      lastCachedCatalogId = snapshot.catalogId;
    } catch {
      // The cache is an optimization; failing to write it is not an error.
    }
  }

  /**
   * Reads the catalog the given pointer refers to. Root and every Shard are
   * fetched in one `get`: the Root names its shards, so a first `get` for the
   * Root is unavoidable, but shard reads are batched.
   */
  async function readSnapshotFor(
    catalogId: string,
  ): Promise<Snapshot | undefined> {
    const rootKey = catalogRootKey(catalogId);
    const rootRaw = (await storage.get([rootKey]))[rootKey];
    if (rootRaw === undefined) return undefined;

    const root = parseOrThrow(catalogRootSchema, rootRaw, 'Catalog Root');

    const shardKeys = root.shardIds.map(catalogShardKey);
    const shardsRaw = shardKeys.length > 0 ? await storage.get(shardKeys) : {};

    const shards: CatalogShard[] = [];
    for (const shardId of root.shardIds) {
      const raw = shardsRaw[catalogShardKey(shardId)];
      if (raw === undefined) return undefined; // incomplete: not yet synced
      const shard = parseOrThrow(catalogShardSchema, raw, 'Catalog Shard');
      if (shard.shardId !== shardId) {
        throw new CorruptionError(
          `Catalog Shard stored at ${shardId} declares shardId ${shard.shardId}.`,
        );
      }
      shards.push(shard);
    }

    const entries = validateSnapshotIntegrity(catalogId, root, shards);
    return {catalogId, root, shards, entries};
  }

  /**
   * Resolves the snapshot to publish: the Pointer's catalog when it is fully
   * present, otherwise the last validated cache (the Pointer may have synced
   * ahead of the items it refers to).
   */
  async function readActiveSnapshot(): Promise<Snapshot> {
    const catalogId = await requirePointer();
    const snapshot = await readSnapshotFor(catalogId);
    if (snapshot) {
      // Do NOT claim catalogId as notified here: reads must never suppress a
      // change notification for other listeners. Only the commit path and the
      // change handler update notifiedCatalogId; an extra notification is a
      // harmless re-read, a missed one leaves a subscriber stale.
      await writeCachedSnapshot(snapshot);
      return snapshot;
    }

    const cached = await readCachedSnapshot();
    if (cached) return cached;

    throw new CorruptionError(
      `Catalog ${catalogId} referenced by the Active Pointer is incomplete and no cached snapshot is available.`,
    );
  }

  /**
   * Validates a function at the persistence boundary and returns the parsed
   * value, so what gets stored is exactly what the schema admits rather than
   * whatever extra properties the caller happened to pass.
   */
  function validateFunction(
    fn: CopyFunction,
  ): v.InferOutput<typeof copyFunctionSchema> {
    const parsed = v.safeParse(copyFunctionSchema, fn);
    if (!parsed.success) {
      throw new ValidationError(
        `Function "${fn?.id}" failed schema validation: ${parsed.issues[0]?.message ?? 'unknown issue'}`,
      );
    }
    if (fn.pattern) {
      try {
        new RegExp(fn.pattern);
      } catch {
        throw new ValidationError(
          `Function "${fn.id}" has a URL pattern that is not a valid regular expression: ${fn.pattern}`,
        );
      }
    }
    return parsed.output;
  }

  function buildDocument(
    fn: v.InferOutput<typeof copyFunctionSchema>,
    documentId: string,
  ): FunctionDocument {
    return {
      formatVersion: 1,
      documentId,
      createdAt: now().toISOString(),
      function: fn,
    };
  }

  function assertDocumentFits(doc: FunctionDocument): void {
    const key = functionDocumentKey(doc.documentId);
    const size = itemByteSize(key, doc);
    if (size > EFFECTIVE_ITEM_BYTES) {
      throw new QuotaError(
        `Function "${doc.function.id}" is ${size} bytes, over the ${EFFECTIVE_ITEM_BYTES} byte limit for a single stored item. Split the code or export it as JSON.`,
        {limitKind: 'item-bytes', limit: EFFECTIVE_ITEM_BYTES, actual: size},
      );
    }
  }

  /**
   * Builds the items a commit will write: the new Function Document (if any),
   * the Shards covering the resulting entry list, and the new Catalog Root.
   */
  function buildCommitItems(
    entries: CopyFunctionRef[],
    newDocument: FunctionDocument | undefined,
  ): {catalogId: string; items: Record<string, unknown>; snapshot: Snapshot} {
    const catalogId = newId();
    const createdAt = now().toISOString();

    const shards = splitIntoShards(entries, {
      catalogId,
      createdAt,
      newShardId: newId,
    });
    const root: CatalogRoot = {
      formatVersion: 1,
      catalogId,
      createdAt,
      shardIds: shards.map(shard => shard.shardId),
    };

    const items: Record<string, unknown> = {};
    if (newDocument) {
      items[functionDocumentKey(newDocument.documentId)] = newDocument;
    }
    for (const shard of shards) {
      items[catalogShardKey(shard.shardId)] = shard;
    }
    items[catalogRootKey(catalogId)] = root;

    return {
      catalogId,
      items,
      snapshot: {catalogId, root, shards, entries},
    };
  }

  /**
   * Commit Preconditions: peak usage is current usage plus everything this
   * mutation writes, because the old snapshot still exists at commit time.
   * GC runs first when the estimate does not fit, and only then do we refuse.
   */
  async function assertCapacity(items: Record<string, unknown>): Promise<void> {
    const newBytes = totalByteSize(items);
    const newItemKeys = Object.keys(items);

    const check = async (): Promise<QuotaError | undefined> => {
      const all = await storage.getAll();
      const currentBytes = totalByteSize(all);
      // Keys we overwrite are already counted; ours are always fresh ids.
      const currentItems = Object.keys(all).length;

      const peakBytes = currentBytes + newBytes;
      if (peakBytes > EFFECTIVE_TOTAL_BYTES) {
        return new QuotaError(
          `Saving would use ${peakBytes} bytes of sync storage, over the ${EFFECTIVE_TOTAL_BYTES} byte limit. Delete unused functions or export them as JSON.`,
          {
            limitKind: 'total-bytes',
            limit: EFFECTIVE_TOTAL_BYTES,
            actual: peakBytes,
          },
        );
      }

      const peakItems = currentItems + newItemKeys.length;
      if (peakItems > EFFECTIVE_MAX_ITEMS) {
        return new QuotaError(
          `Saving would use ${peakItems} storage items, over the ${EFFECTIVE_MAX_ITEMS} item limit. Delete unused functions or export them as JSON.`,
          {
            limitKind: 'item-count',
            limit: EFFECTIVE_MAX_ITEMS,
            actual: peakItems,
          },
        );
      }
      return undefined;
    };

    const first = await check();
    if (!first) return;

    await runGc();

    const second = await check();
    if (second) throw second;
  }

  function notifyListeners(): void {
    // Snapshot first: a listener may unsubscribe itself while being called.
    const current = Array.from(listeners);
    for (const listener of current) {
      try {
        listener();
      } catch (error) {
        console.error('cocopy: function store listener failed', error);
      }
    }
  }

  /** Steps 1-7 of the Commit Protocol (docs/function-storage.md). */
  async function commit(
    baseCatalogId: string,
    entries: CopyFunctionRef[],
    newDocument: FunctionDocument | undefined,
  ): Promise<void> {
    const {catalogId, items, snapshot} = buildCommitItems(entries, newDocument);

    await assertCapacity(items);

    // (2)(3) Write the new Document, Shards and Root in one call.
    await storage.set(items);

    // (4) Read back what we wrote plus every document the new catalog refers
    // to, and abort if anything is missing.
    const documentKeys = entries.map(entry =>
      functionDocumentKey(entry.documentId),
    );
    const verifyKeys = [...new Set([...Object.keys(items), ...documentKeys])];
    const readBack = await storage.get(verifyKeys);
    const missing = verifyKeys.filter(key => readBack[key] === undefined);
    if (missing.length > 0) {
      throw new CorruptionError(
        `Aborting commit: ${missing.length} item(s) could not be read back after writing (${missing[0]}).`,
      );
    }

    // (5) The base must still be current, or another context committed first.
    const currentCatalogId = await readPointerValue();
    if (currentCatalogId !== baseCatalogId) {
      throw new ConflictError(
        'The stored functions changed in another window while this change was being saved. Reload and try again.',
      );
    }

    // (6) Publish the new snapshot. Claim the new catalogId as already seen
    // before yielding, so the change event our own write triggers does not
    // produce a second notification alongside the one below.
    const previouslyNotified = notifiedCatalogId;
    notifiedCatalogId = catalogId;
    try {
      await storage.set({
        [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId},
      });
    } catch (error) {
      // Nothing was published, so a later change must still notify.
      notifiedCatalogId = previouslyNotified;
      throw error;
    }

    // (7) Confirm the commit landed.
    const confirmed = await readPointerValue();
    if (confirmed !== catalogId) {
      throw new CorruptionError(
        'Aborting commit: the Active Pointer did not hold the new catalog after writing it.',
      );
    }

    await writeCachedSnapshot(snapshot);
    notifyListeners();

    void runGc().catch(() => undefined);
  }

  async function mutate(
    build: (snapshot: Snapshot) => {
      entries: CopyFunctionRef[];
      document?: FunctionDocument;
    } | null,
  ): Promise<void> {
    return enqueue(async () => {
      const snapshot = await readActiveSnapshot();
      const plan = build(snapshot);
      if (plan === null) return; // nothing to write (idempotent no-op)
      await commit(snapshot.catalogId, plan.entries, plan.document);
    });
  }

  function prepareWrite(fn: CopyFunction): {
    document: FunctionDocument;
    ref: CopyFunctionRef;
  } {
    const validated = validateFunction(fn);
    const documentId = newId();
    const document = buildDocument(validated, documentId);
    assertDocumentFits(document);
    // The ref is derived from the same validated value that becomes the
    // document, so the two can never disagree.
    return {document, ref: refFromFunction(document.function, documentId)};
  }

  // --- Garbage Collection ------------------------------------------------

  async function reachableKeys(): Promise<Set<string>> {
    const reachable = new Set<string>();
    const catalogId = await readPointerValue();
    if (catalogId === undefined) return reachable;

    const rootKey = catalogRootKey(catalogId);
    reachable.add(rootKey);

    const rootRaw = (await storage.get([rootKey]))[rootKey];
    const root = v.safeParse(catalogRootSchema, rootRaw);
    if (!root.success) return reachable;

    const shardKeys = root.output.shardIds.map(catalogShardKey);
    for (const key of shardKeys) reachable.add(key);
    if (shardKeys.length === 0) return reachable;

    const shardsRaw = await storage.get(shardKeys);
    for (const key of shardKeys) {
      const shard = v.safeParse(catalogShardSchema, shardsRaw[key]);
      if (!shard.success) continue;
      for (const entry of shard.output.entries) {
        reachable.add(functionDocumentKey(entry.documentId));
      }
    }
    return reachable;
  }

  function createdAtOf(value: unknown): number | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const createdAt = (value as {createdAt?: unknown}).createdAt;
    if (typeof createdAt !== 'string') return undefined;
    const time = Date.parse(createdAt);
    return Number.isNaN(time) ? undefined : time;
  }

  async function runGc(): Promise<void> {
    try {
      const all = await storage.getAll();
      const cutoff = now().getTime() - GC_GRACE_MS;

      // Only v1-prefixed keys are ours; the Pointer and everything else
      // (including the legacy `functions` item) is never touched.
      const candidates = Object.keys(all).filter(
        key => key !== ACTIVE_POINTER_KEY && isFunctionStoreV1Key(key),
      );
      if (candidates.length === 0) return;

      const aged = candidates.filter(key => {
        const createdAt = createdAtOf(all[key]);
        // An unreadable createdAt means we cannot prove the item is old, so
        // it stays: GC is best effort and deleting live data costs more.
        if (createdAt === undefined) return false;
        return createdAt <= cutoff;
      });
      if (aged.length === 0) return;

      // Re-read the Pointer right before deleting, so a snapshot that arrived
      // from another device while we were scanning is treated as reachable.
      const reachable = await reachableKeys();
      const removable = aged.filter(key => !reachable.has(key));
      if (removable.length === 0) return;

      await storage.remove(removable);
    } catch {
      // GC failures never affect correctness.
    }
  }

  // --- Change notification -----------------------------------------------

  function startWatching(): void {
    if (storageUnsubscribe) return;
    // Establish the baseline generation at subscription start, so a pointer
    // rewrite that does not change the catalogId is not reported as a change.
    // The guard keeps a concurrent change handler's newer value if it won.
    void readPointerValue().then(
      catalogId => {
        if (notifiedCatalogId === undefined) notifiedCatalogId = catalogId;
      },
      () => undefined,
    );
    storageUnsubscribe = storage.subscribe(changedKeys => {
      if (!changedKeys.includes(ACTIVE_POINTER_KEY)) return;
      void (async () => {
        let catalogId: string | undefined;
        try {
          catalogId = await readPointerValue();
        } catch {
          return;
        }
        if (catalogId === undefined || catalogId === notifiedCatalogId) return;
        notifiedCatalogId = catalogId;
        notifyListeners();
      })();
    });
  }

  function stopWatching(): void {
    storageUnsubscribe?.();
    storageUnsubscribe = undefined;
  }

  return {
    async list(): Promise<CopyFunctionRef[]> {
      const snapshot = await readActiveSnapshot();
      return snapshot.entries;
    },

    async listForUrl(url: string): Promise<CopyFunctionRef[]> {
      const snapshot = await readActiveSnapshot();
      return snapshot.entries.filter(entry => {
        if (!entry.pattern) return true;
        const regexp = compilePattern(entry.pattern);
        // An entry whose pattern no longer compiles is dropped from the list
        // rather than failing the whole read.
        if (!regexp) return false;
        return regexp.test(url);
      });
    },

    async get(ref: CopyFunctionRef): Promise<CopyFunction | undefined> {
      const key = functionDocumentKey(ref.documentId);
      const raw = (await storage.get([key]))[key];
      if (raw === undefined) return undefined;

      const doc = parseOrThrow(
        functionDocumentSchema,
        raw,
        'Function Document',
      );
      if (doc.documentId !== ref.documentId) {
        throw new CorruptionError(
          `Function Document stored at ${ref.documentId} declares documentId ${doc.documentId}.`,
        );
      }
      const derived = refFromFunction(doc.function, ref.documentId);
      if (!refsEqual(derived, ref)) {
        throw new CorruptionError(
          `Function Document ${ref.documentId} does not match the catalog entry that referenced it.`,
        );
      }
      return doc.function;
    },

    async create(fn: CopyFunction): Promise<void> {
      const {document, ref} = prepareWrite(fn);
      return mutate(snapshot => {
        if (snapshot.entries.some(entry => entry.id === fn.id)) {
          throw new ValidationError(
            `A function with id "${fn.id}" already exists.`,
          );
        }
        if (snapshot.entries.length >= MAX_FUNCTIONS) {
          throw new QuotaError(
            `Cannot add another function: the limit is ${MAX_FUNCTIONS}.`,
            {
              limitKind: 'function-count',
              limit: MAX_FUNCTIONS,
              actual: snapshot.entries.length + 1,
            },
          );
        }
        return {entries: [...snapshot.entries, ref], document};
      });
    },

    async update(fn: CopyFunction, baseDocumentId?: string): Promise<void> {
      const {document, ref} = prepareWrite(fn);
      return mutate(snapshot => {
        const index = snapshot.entries.findIndex(entry => entry.id === fn.id);
        if (index === -1) {
          throw new ConflictError(
            `Function "${fn.id}" is no longer in the stored function list; it may have been deleted in another window. Reload and try again.`,
          );
        }
        if (
          baseDocumentId !== undefined &&
          snapshot.entries[index].documentId !== baseDocumentId
        ) {
          throw new ConflictError(
            `Function "${fn.id}" was changed in another window after it was opened here. Reload and try again.`,
          );
        }
        const entries = [...snapshot.entries];
        entries[index] = ref;
        return {entries, document};
      });
    },

    async delete(id: string): Promise<void> {
      return mutate(snapshot => {
        if (!snapshot.entries.some(entry => entry.id === id)) return null;
        return {entries: snapshot.entries.filter(entry => entry.id !== id)};
      });
    },

    async reorder(orderedIds: string[]): Promise<void> {
      return mutate(snapshot => {
        const byId = new Map(snapshot.entries.map(entry => [entry.id, entry]));
        const unique = new Set(orderedIds);
        const isPermutation =
          unique.size === orderedIds.length &&
          orderedIds.length === byId.size &&
          orderedIds.every(id => byId.has(id));
        if (!isPermutation) {
          throw new ConflictError(
            'The requested order does not match the stored functions; they may have changed in another window. Reload and try again.',
          );
        }
        // Reorder never rewrites Function Documents, only the Catalog.
        return {entries: orderedIds.map(id => byId.get(id) as CopyFunctionRef)};
      });
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.add(listener);
      startWatching();

      let active = true;
      return () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
        if (listeners.size === 0) stopWatching();
      };
    },

    gc: runGc,
  };
}
