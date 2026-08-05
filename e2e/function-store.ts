// Seed and read back FunctionStore-format data from Playwright specs.
//
// The old E2E specs wrote the legacy `chrome.storage.sync["functions"]` array
// directly. Mutations no longer touch that key, so seeding and reading it back
// no longer describes what the extension stores. This module builds the same
// item set the repository would commit (Active Pointer + Catalog Root +
// Catalog Shards + Function Documents) and writes it in one `set`, then reads
// it back by walking Pointer -> Root -> Shards -> Documents.
//
// It deliberately reuses the production pure modules (keys, catalog splitting,
// ref projection) so a change to the storage layout breaks these helpers
// instead of silently making the specs assert against a stale shape. None of
// those modules touch `chrome` or `vitest`, so they import cleanly here.

import type {Page} from '@playwright/test';

import type {CopyFunction} from '../src/lib/function';
import {splitIntoShards} from '../src/lib/function-store/catalog';
import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
} from '../src/lib/function-store/keys';
import {
  LEGACY_BACKUP_KEY,
  LEGACY_FUNCTIONS_KEY,
  MIGRATION_RESULT_KEY,
  type MigrationResult,
} from '../src/lib/function-store/migration';
import type {
  CatalogRoot,
  FunctionDocument,
} from '../src/lib/function-store/schema';
import {refFromFunction} from '../src/lib/function-store/types';

const SEED_CREATED_AT = '2026-07-20T00:00:00.000Z';

/**
 * What a Function Document may hold. This is `CopyFunction` narrowed by the
 * stored schema (notably `version: 1`), so seeds are rejected at compile time
 * if they would not validate on read.
 */
export type SeedFunction = FunctionDocument['function'];

let idCounter = 0;
function seedId(kind: string): string {
  idCounter += 1;
  return `e2e-${kind}-${idCounter}`;
}

export interface SeededStore {
  catalogId: string;
  shardIds: string[];
  documentIds: string[];
  items: Record<string, unknown>;
}

/**
 * Builds every item a committed FunctionStore snapshot consists of, in the
 * same shape and split as a real commit: one Function Document per function,
 * Catalog Shards produced by the production splitting rule, one Catalog Root
 * listing them in order, and the Active Pointer last.
 */
export function buildFunctionStoreItems(
  functions: SeedFunction[],
): SeededStore {
  const catalogId = seedId('catalog');
  const items: Record<string, unknown> = {};
  const documentIds: string[] = [];

  const entries = functions.map(fn => {
    const documentId = seedId('doc');
    documentIds.push(documentId);
    const document: FunctionDocument = {
      formatVersion: 1,
      documentId,
      createdAt: SEED_CREATED_AT,
      function: fn,
    };
    items[functionDocumentKey(documentId)] = document;
    return refFromFunction(fn, documentId);
  });

  const shards = splitIntoShards(entries, {
    catalogId,
    createdAt: SEED_CREATED_AT,
    newShardId: () => seedId('shard'),
  });
  for (const shard of shards) {
    items[catalogShardKey(shard.shardId)] = shard;
  }

  const root: CatalogRoot = {
    formatVersion: 1,
    catalogId,
    createdAt: SEED_CREATED_AT,
    shardIds: shards.map(shard => shard.shardId),
  };
  items[catalogRootKey(catalogId)] = root;
  items[ACTIVE_POINTER_KEY] = {formatVersion: 1, catalogId};

  return {
    catalogId,
    shardIds: shards.map(shard => shard.shardId),
    documentIds,
    items,
  };
}

/**
 * Wipes sync and the FunctionStore's local state, then writes a committed
 * snapshot for `functions`. Clearing matters: a leftover Active Pointer would
 * make the repository skip migration, and a stale snapshot cache would let a
 * read succeed against data the test just replaced.
 *
 * `page` must already be on an extension-origin page (`chrome.storage` is not
 * reachable from anywhere else).
 */
export async function seedFunctionStore(
  page: Page,
  functions: SeedFunction[],
): Promise<SeededStore> {
  const seeded = buildFunctionStoreItems(functions);
  await clearStorage(page);
  await page.evaluate(
    items => chrome.storage.sync.set(items),
    seeded.items as Record<string, unknown>,
  );
  return seeded;
}

/** Removes everything from both storage areas, including any legacy value. */
export async function clearStorage(page: Page): Promise<void> {
  // The extension page that gives specs a chrome.storage-capable origin also
  // boots the app, whose repository runs the defaults migration on the first
  // read. Those writes land 50-400ms after `load`, so clearing immediately
  // races them: a late Active Pointer write makes the next reload skip
  // migration (the spec sees defaults instead of its seed), and a clear
  // landing between the migration's item write and its pointer write leaves a
  // pointer aimed at a wiped catalog. The migration result is its final write
  // (recordResult in migration.ts), so once it exists nothing from that boot
  // is still in flight.
  await page.waitForFunction(
    async key => (await chrome.storage.local.get(key))[key] !== undefined,
    MIGRATION_RESULT_KEY,
  );
  await page.evaluate(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
  });
}

/**
 * Seeds the pre-FunctionStore format only: the legacy sync array, with no
 * Active Pointer. Opening popup or options then triggers migration.
 *
 * Takes `unknown` because migration specs deliberately seed values that are
 * not valid functions (or not even an array).
 */
export async function seedLegacyFunctions(
  page: Page,
  legacy: unknown,
): Promise<void> {
  await clearStorage(page);
  await page.evaluate(
    value => chrome.storage.sync.set({[value.key]: value.legacy}),
    {key: LEGACY_FUNCTIONS_KEY, legacy} as {key: string; legacy: unknown},
  );
}

/**
 * Reads the current committed snapshot the way the repository does: Active
 * Pointer -> Catalog Root -> Shards (in the Root's order) -> Function
 * Documents. Returns the functions in catalog order, or `undefined` when no
 * Active Pointer exists.
 *
 * Written as a single `page.evaluate` so the whole walk observes one storage
 * state rather than racing a commit in the page.
 */
export async function readStoredFunctions(
  page: Page,
): Promise<CopyFunction[] | undefined> {
  return page.evaluate(
    async keys => {
      const pointerValue = (await chrome.storage.sync.get(keys.pointer))[
        keys.pointer
      ] as {catalogId?: string} | undefined;
      if (!pointerValue?.catalogId) return undefined;

      const rootKey = `${keys.prefix}catalog:${pointerValue.catalogId}`;
      const root = (await chrome.storage.sync.get(rootKey))[rootKey] as
        | {shardIds: string[]}
        | undefined;
      if (!root) return undefined;

      const shardKeys = root.shardIds.map(
        id => `${keys.prefix}catalog-shard:${id}`,
      );
      const shardValues = await chrome.storage.sync.get(shardKeys);
      const documentIds: string[] = [];
      for (const shardKey of shardKeys) {
        const shard = shardValues[shardKey] as
          | {entries: {documentId: string}[]}
          | undefined;
        if (!shard) continue;
        for (const entry of shard.entries) documentIds.push(entry.documentId);
      }

      const documentKeys = documentIds.map(
        id => `${keys.prefix}function:${id}`,
      );
      const documentValues = await chrome.storage.sync.get(documentKeys);
      const functions: unknown[] = [];
      for (const documentKey of documentKeys) {
        const doc = documentValues[documentKey] as
          | {function: unknown}
          | undefined;
        if (doc) functions.push(doc.function);
      }
      return functions;
    },
    {pointer: ACTIVE_POINTER_KEY, prefix: 'cocopy:function-store:v1:'},
  ) as Promise<CopyFunction[] | undefined>;
}

/** Names of the stored functions in catalog order; `[]` when nothing is stored. */
export async function readStoredFunctionNames(page: Page): Promise<string[]> {
  const functions = await readStoredFunctions(page);
  return (functions ?? []).map(fn => fn.name);
}

/** Raw value of the Active Pointer, or `undefined` when it was never written. */
export async function readActivePointer(
  page: Page,
): Promise<{formatVersion: number; catalogId: string} | undefined> {
  return page.evaluate(
    async key =>
      (await chrome.storage.sync.get(key))[key] as
        | {formatVersion: number; catalogId: string}
        | undefined,
    ACTIVE_POINTER_KEY,
  );
}

/** Raw value of the legacy sync key, used to assert migration left it alone. */
export async function readLegacyFunctions(page: Page): Promise<unknown> {
  return page.evaluate(
    async key => (await chrome.storage.sync.get(key))[key] as unknown,
    LEGACY_FUNCTIONS_KEY,
  );
}

/** The legacy backup JSON migration writes to storage.local before touching sync. */
export async function readLegacyBackup(
  page: Page,
): Promise<string | undefined> {
  return page.evaluate(
    async key =>
      (await chrome.storage.local.get(key))[key] as string | undefined,
    LEGACY_BACKUP_KEY,
  );
}

/** The recorded migration result, or `undefined` when migration never ran. */
export async function readMigrationResult(
  page: Page,
): Promise<MigrationResult | undefined> {
  return page.evaluate(
    async key =>
      (await chrome.storage.local.get(key))[key] as MigrationResult | undefined,
    MIGRATION_RESULT_KEY,
  );
}

/** Total sync usage measured the way the repository measures it: key + JSON value. */
export async function readSyncUsage(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const all = await chrome.storage.sync.get(null);
    const encoder = new TextEncoder();
    let total = 0;
    for (const [key, value] of Object.entries(all)) {
      total +=
        encoder.encode(key).length +
        encoder.encode(JSON.stringify(value)).length;
    }
    return total;
  });
}

/** Number of Catalog Shards the committed snapshot is split across. */
export async function readShardCount(page: Page): Promise<number> {
  return page.evaluate(
    async keys => {
      const pointer = (await chrome.storage.sync.get(keys.pointer))[
        keys.pointer
      ] as {catalogId?: string} | undefined;
      if (!pointer?.catalogId) return 0;
      const rootKey = `${keys.prefix}catalog:${pointer.catalogId}`;
      const root = (await chrome.storage.sync.get(rootKey))[rootKey] as
        | {shardIds: string[]}
        | undefined;
      return root?.shardIds.length ?? 0;
    },
    {pointer: ACTIVE_POINTER_KEY, prefix: 'cocopy:function-store:v1:'},
  );
}
