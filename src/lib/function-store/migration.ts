// Migration Coordinator (docs/function-storage.md, "Migration Plan" /
// "Migration Coordinator" / "Partial Migration" / "Migration Failure").
//
// Moves the legacy single-item `storage.sync["functions"]` array into the
// FunctionStore format (Active Pointer + Catalog + Function Documents). This
// module is the only place that interprets the legacy shape; `FunctionRepository`
// only ever calls `migrate()` through its `onMissingActivePointer` hook.

import * as v from 'valibot';

import {defaultFunctions as builtinDefaultFunctions} from '../builtin';
import {CopyFunction} from '../function';
import {copyFunctionSchema} from '../function.schema';
import {splitIntoShards} from './catalog';
import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
  newId as defaultNewId,
} from './keys';
import {CatalogRoot, FunctionDocument} from './schema';
import {EFFECTIVE_ITEM_BYTES, itemByteSize} from './size';
import {KeyValueStorage} from './storage';
import {CopyFunctionRef, MigrationError, refFromFunction} from './types';

export const LEGACY_FUNCTIONS_KEY = 'functions';
export const LEGACY_BACKUP_KEY = 'cocopy:legacy-backup:sync-functions';
export const MIGRATION_RESULT_KEY =
  'cocopy:migration:sync-functions-to-function-store-v1';

const migrationSkipSchema = v.strictObject({
  id: v.string(),
  name: v.string(),
  reason: v.picklist(['schema', 'pattern', 'size']),
});
export type MigrationSkip = v.InferOutput<typeof migrationSkipSchema>;

export const migrationResultSchema = v.strictObject({
  formatVersion: v.literal(1),
  migratedAt: v.pipe(v.string(), v.isoTimestamp()),
  outcome: v.picklist(['completed', 'failed']),
  legacyExisted: v.boolean(),
  migratedCount: v.number(),
  skipped: v.array(migrationSkipSchema),
  renamedIds: v.array(v.strictObject({from: v.string(), to: v.string()})),
  error: v.optional(v.string()), // outcome === 'failed' only
});
export type MigrationResult = v.InferOutput<typeof migrationResultSchema>;

export interface CreateMigrationCoordinatorOptions {
  sync: KeyValueStorage;
  local: KeyValueStorage;
  now?: () => Date;
  newId?: () => string;
  defaultFunctions?: CopyFunction[];
}

export interface MigrationCoordinator {
  migrate(): Promise<void>;
}

function patternCompiles(pattern: string | undefined): boolean {
  if (!pattern) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

type ValidatedFunction = v.InferOutput<typeof copyFunctionSchema>;

/**
 * Validates one legacy function independently of the others (Partial
 * Migration): a rejection here only excludes this function, it never aborts
 * the whole migration.
 *
 * Exported so the Legacy Storage Backup UI can apply the same criteria when
 * deciding whether a legacy entry can be imported as-is.
 */
export function classifyFunction(
  fn: unknown,
):
  | {ok: true; fn: ValidatedFunction}
  | {ok: false; reason: MigrationSkip['reason']} {
  const parsed = v.safeParse(copyFunctionSchema, fn);
  if (!parsed.success) return {ok: false, reason: 'schema'};

  if (!patternCompiles(parsed.output.pattern)) {
    return {ok: false, reason: 'pattern'};
  }

  return {ok: true, fn: parsed.output};
}

/**
 * Best-effort id/name for a skip entry even when schema validation failed.
 * Exported so the Legacy Storage Backup UI matches its rows against skip
 * records the same way they were written.
 */
export function describeUnknown(fn: unknown): {id: string; name: string} {
  const obj =
    typeof fn === 'object' && fn !== null
      ? (fn as Record<string, unknown>)
      : {};
  const id = typeof obj.id === 'string' ? obj.id : '(unknown id)';
  const name = typeof obj.name === 'string' ? obj.name : '(unknown name)';
  return {id, name};
}

/**
 * Structural equality for JSON-shaped values. The read-back verification must
 * not compare serialized strings: chrome.storage round-trips values through
 * its own serializer and returns objects with keys sorted alphabetically, so
 * `JSON.stringify` of what was written never matches what is read back.
 * Properties whose value is `undefined` are treated as absent, matching how
 * that serializer (like JSON) drops them.
 */
function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, i) => jsonEqual(value, b[i]))
    );
  }
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).filter(key => aObj[key] !== undefined);
    const bKeys = Object.keys(bObj).filter(key => bObj[key] !== undefined);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every(key => jsonEqual(aObj[key], bObj[key]))
    );
  }
  return false;
}

async function recordResult(
  local: KeyValueStorage,
  result: MigrationResult,
): Promise<void> {
  try {
    await local.set({[MIGRATION_RESULT_KEY]: result});
  } catch {
    // Recording the result is best effort; the migration's own outcome
    // (pointer written or not, legacy backup present or not) is what matters.
  }
}

export function createMigrationCoordinator(
  options: CreateMigrationCoordinatorOptions,
): MigrationCoordinator {
  const {sync, local} = options;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? defaultNewId;
  const defaultFunctions = options.defaultFunctions ?? builtinDefaultFunctions;

  async function migrate(): Promise<void> {
    // Step 1: never re-migrate once a Pointer exists.
    const pointerRaw = (await sync.get([ACTIVE_POINTER_KEY]))[
      ACTIVE_POINTER_KEY
    ];
    if (pointerRaw !== undefined) return;

    // Step 2-3: read legacy data without a default value; a missing key seeds
    // defaultFunctions instead of aborting.
    const legacyRaw = (await sync.get([LEGACY_FUNCTIONS_KEY]))[
      LEGACY_FUNCTIONS_KEY
    ];
    const legacyExisted = legacyRaw !== undefined;
    const source: unknown = legacyExisted ? legacyRaw : defaultFunctions;

    // Step 4: abort if the legacy value cannot be read as an array. This
    // check only applies when the key existed; defaultFunctions is always an
    // array.
    if (!Array.isArray(source)) {
      const message =
        'Legacy function data is not an array; migration cannot proceed.';
      await recordResult(local, {
        formatVersion: 1,
        migratedAt: now().toISOString(),
        outcome: 'failed',
        legacyExisted,
        migratedCount: 0,
        skipped: [],
        renamedIds: [],
        error: message,
      });
      throw new MigrationError(message);
    }

    // Step 5: back up the legacy raw JSON before touching the FunctionStore,
    // and verify the write round-trips. Only runs when the legacy key existed;
    // there is nothing to back up for a fresh install.
    if (legacyExisted) {
      try {
        const rawJson = JSON.stringify(legacyRaw);
        await local.set({[LEGACY_BACKUP_KEY]: rawJson});
        const readBack = (await local.get([LEGACY_BACKUP_KEY]))[
          LEGACY_BACKUP_KEY
        ];
        if (readBack !== rawJson) {
          throw new Error(
            'legacy backup did not read back identical to what was written',
          );
        }
      } catch (cause) {
        const message = `Failed to back up legacy function data before migrating: ${cause instanceof Error ? cause.message : String(cause)}`;
        await recordResult(local, {
          formatVersion: 1,
          migratedAt: now().toISOString(),
          outcome: 'failed',
          legacyExisted,
          migratedCount: 0,
          skipped: [],
          renamedIds: [],
          error: message,
        });
        throw new MigrationError(message);
      }
    }

    // Step 6: validate each function independently and pick the migratable
    // subset (Partial Migration). Duplicate logical ids are renamed rather
    // than excluded.
    const skipped: MigrationSkip[] = [];
    const renamedIds: {from: string; to: string}[] = [];
    const seenIds = new Set<string>();
    const migratable: ValidatedFunction[] = [];
    // new id -> original id; recorded in renamedIds only once the function is
    // actually stored, so a later skip is reported under the id the user knows.
    const renamedFrom = new Map<string, string>();

    for (const item of source) {
      const classified = classifyFunction(item);
      if (!classified.ok) {
        const {id, name} = describeUnknown(item);
        skipped.push({id, name, reason: classified.reason});
        continue;
      }

      let fn = classified.fn;
      if (seenIds.has(fn.id)) {
        const from = fn.id;
        const to = newId();
        fn = {...fn, id: to};
        renamedFrom.set(to, from);
      }
      seenIds.add(fn.id);

      migratable.push(fn);
    }

    // Item-bytes check needs a documentId to measure the real key length, so
    // it runs as a second pass once ids (including renames) are final.
    const createdAt = now().toISOString();
    const documents: FunctionDocument[] = [];
    const entries: CopyFunctionRef[] = [];
    for (const fn of migratable) {
      const documentId = newId();
      const document: FunctionDocument = {
        formatVersion: 1,
        documentId,
        createdAt,
        function: fn,
      };
      const size = itemByteSize(functionDocumentKey(documentId), document);
      if (size > EFFECTIVE_ITEM_BYTES) {
        skipped.push({
          id: renamedFrom.get(fn.id) ?? fn.id,
          name: fn.name,
          reason: 'size',
        });
        continue;
      }
      const from = renamedFrom.get(fn.id);
      if (from !== undefined) renamedIds.push({from, to: fn.id});
      documents.push(document);
      entries.push(refFromFunction(fn, documentId));
    }

    // Step 7: write the Function Documents, Catalog Shards, and Catalog Root
    // to sync in one `set`.
    const catalogId = newId();

    try {
      // Inside the try: splitIntoShards throws QuotaError when a single
      // catalog entry cannot fit a Shard on its own. That is hard to reach
      // (an entry carries no code, so it needs a multi-kilobyte name or
      // pattern that still passed the document check above), but if it does
      // happen it must be recorded as a failed migration like any other
      // write problem, not thrown out of migrate() with no result at all.
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
      for (const document of documents) {
        items[functionDocumentKey(document.documentId)] = document;
      }
      for (const shard of shards) {
        items[catalogShardKey(shard.shardId)] = shard;
      }
      items[catalogRootKey(catalogId)] = root;

      await sync.set(items);

      // Step 8: read back what was written and confirm count, order, and
      // content match the migrated source exactly. Comparing every written
      // item covers the Documents, the Root, and the Shards whose entries
      // carry the migrated order.
      const writtenKeys = Object.keys(items);
      const readBack = await sync.get(writtenKeys);
      const missing = writtenKeys.filter(key => readBack[key] === undefined);
      if (missing.length > 0) {
        throw new Error(
          `${missing.length} item(s) could not be read back after writing (${missing[0]}).`,
        );
      }
      for (const key of writtenKeys) {
        if (!jsonEqual(readBack[key], items[key])) {
          throw new Error(
            `Item ${key} did not read back identical to what was written.`,
          );
        }
      }

      // Step 9: activate the FunctionStore.
      await sync.set({[ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId}});
    } catch (cause) {
      // Storage-error failure (step 7/9): the snapshot could not be built, or
      // the write failed or did not round-trip. legacy data is untouched and
      // the Pointer was never
      // written, so the next migrate() call retries from scratch. Any
      // partial items left behind are orphans for the repository's GC to
      // collect; this coordinator does not clean them up itself. Recording
      // this failure is best effort only.
      const message = `Failed to write FunctionStore data during migration: ${cause instanceof Error ? cause.message : String(cause)}`;
      await recordResult(local, {
        formatVersion: 1,
        migratedAt: now().toISOString(),
        outcome: 'failed',
        legacyExisted,
        migratedCount: 0,
        skipped: [],
        renamedIds: [],
        error: message,
      });
      throw new MigrationError(message);
    }

    // Step 10: record the migration result (best effort).
    await recordResult(local, {
      formatVersion: 1,
      migratedAt: now().toISOString(),
      outcome: 'completed',
      legacyExisted,
      // Count what was actually written: functions skipped for size in the
      // second pass are excluded here even though they passed schema checks.
      migratedCount: entries.length,
      skipped,
      renamedIds,
    });
  }

  return {migrate};
}

export interface LegacyBackupStatus {
  legacyRaw: string | undefined;
  backupRaw: string | undefined;
  result: MigrationResult | undefined;
}

export interface LegacyBackupRepository {
  status(): Promise<LegacyBackupStatus>;
  /**
   * Deletes one function from the legacy data. `index` is the position in
   * the array the UI renders (the backup when present, otherwise the legacy
   * sync value), and `expected` is the raw entry the UI showed there: the
   * delete only proceeds if that position still holds that entry, so a stale
   * page cannot delete a different function. The matching entry is removed
   * from the other copy as well: data deleted for containing a secret must
   * be gone from both stores, and the delete fails without writing anything
   * when the other copy holds a diverged version of the entry that a
   * structural match would leave behind.
   */
  deleteEntry(index: number, expected: unknown): Promise<void>;
}

function parseBackupArray(raw: unknown): unknown[] | undefined {
  if (typeof raw !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * View over the legacy sync value, the local backup, and the recorded
 * migration result, for the Legacy Storage Backup UI
 * (docs/function-storage.md, "Legacy Storage Backup UI"). Mutation is limited
 * to deleting individual entries.
 */
export function createLegacyBackupRepository(options: {
  sync: KeyValueStorage;
  local: KeyValueStorage;
}): LegacyBackupRepository {
  const {sync, local} = options;

  return {
    async status(): Promise<LegacyBackupStatus> {
      const syncValues = await sync.get([LEGACY_FUNCTIONS_KEY]);
      const legacyValue = syncValues[LEGACY_FUNCTIONS_KEY];
      const legacyRaw =
        legacyValue !== undefined ? JSON.stringify(legacyValue) : undefined;

      const localValues = await local.get([
        LEGACY_BACKUP_KEY,
        MIGRATION_RESULT_KEY,
      ]);
      const backupRawValue = localValues[LEGACY_BACKUP_KEY];
      const backupRaw =
        typeof backupRawValue === 'string' ? backupRawValue : undefined;
      // A corrupt result degrades to "no result recorded" rather than
      // crashing the backup UI.
      const parsedResult = v.safeParse(
        migrationResultSchema,
        localValues[MIGRATION_RESULT_KEY],
      );
      const result = parsedResult.success ? parsedResult.output : undefined;

      return {legacyRaw, backupRaw, result};
    },

    async deleteEntry(index: number, expected: unknown): Promise<void> {
      const legacyValue = (await sync.get([LEGACY_FUNCTIONS_KEY]))[
        LEGACY_FUNCTIONS_KEY
      ];
      const legacy = Array.isArray(legacyValue) ? legacyValue : undefined;
      const backupRawValue = (await local.get([LEGACY_BACKUP_KEY]))[
        LEGACY_BACKUP_KEY
      ];
      const backup = parseBackupArray(backupRawValue);
      // Deleting only from sync while an unreadable backup keeps the entry
      // would silently break the both-stores guarantee this page promises.
      if (backupRawValue !== undefined && backup === undefined) {
        throw new Error(
          'The legacy backup could not be read, so the entry cannot be deleted from it.',
        );
      }

      const source = backup ?? legacy;
      if (!source || index < 0 || index >= source.length) {
        throw new Error(
          'This entry no longer exists in the legacy data. Reload and try again.',
        );
      }
      // The index was taken from a rendered snapshot; another page may have
      // rewritten the array since. Deleting by a stale index would remove a
      // different function than the one the user confirmed.
      if (!jsonEqual(source[index], expected)) {
        throw new Error(
          'The legacy data changed since it was displayed. Reload and try again.',
        );
      }
      const [removed] = source.splice(index, 1);

      // `jsonEqual` rather than an index: the two copies are normally
      // identical, but nothing enforces it, and chrome.storage reorders
      // object keys on round-trips.
      const other = source === backup ? legacy : backup;
      if (other) {
        const match = other.findIndex(item => jsonEqual(item, removed));
        if (match >= 0) {
          other.splice(match, 1);
        } else {
          // No structural match. An entry that is absent from the other copy
          // is fine (a retry after a partial failure lands here), but a
          // diverged version under the same id — e.g. the old extension
          // edited the sync value after migration — must not survive a
          // delete that reports success. Fail closed before writing.
          // Identity is the entry's `id` when it has one; an id-less entry
          // has no identity to diverge under and falls through to "absent".
          const removedId =
            typeof removed === 'object' &&
            removed !== null &&
            typeof (removed as {id?: unknown}).id === 'string'
              ? (removed as {id: string}).id
              : undefined;
          const diverged =
            removedId !== undefined &&
            other.some(item => describeUnknown(item).id === removedId);
          if (diverged) {
            throw new Error(
              'The old sync data holds a different version of this function, ' +
                'so it was not deleted. Reload and try again.',
            );
          }
        }
      }

      // sync before backup, deliberately. The two writes are not atomic, so
      // order decides what a failure between them leaves behind. Writing sync
      // first fails towards "still visible in the backup the UI reads, already
      // gone from sync" — the user retries and it works. The reverse order
      // fails towards "gone from the backup, still in sync", which hides a
      // secret this page exists to delete and puts it out of reach.
      if (legacy) {
        await sync.set({[LEGACY_FUNCTIONS_KEY]: legacy});
      }
      if (backup) {
        await local.set({[LEGACY_BACKUP_KEY]: JSON.stringify(backup)});
      }
    },
  };
}
