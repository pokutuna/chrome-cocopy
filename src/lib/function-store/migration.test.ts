import {defaultFunctions} from '../builtin';
import {CopyFunction} from '../function';
import {ACTIVE_POINTER_KEY, catalogRootKey, catalogShardKey} from './keys';
import {InMemoryKeyValueStorage} from './memory-storage';
import {
  createLegacyBackupRepository,
  createMigrationCoordinator,
  LEGACY_BACKUP_KEY,
  LEGACY_FUNCTIONS_KEY,
  MIGRATION_RESULT_KEY,
  MigrationResult,
} from './migration';
import {createFunctionRepository} from './repository';
import {
  BASE_TIME,
  makeFunction,
  sequentialIds,
  TestClock,
} from './repository.test-helpers';
import {MigrationError} from './types';

function makeHarness(overrides: {defaultFunctions?: CopyFunction[]} = {}) {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  const clock = new TestClock();
  const coordinator = createMigrationCoordinator({
    sync,
    local,
    now: clock.now,
    newId: sequentialIds(),
    ...overrides,
  });
  return {sync, local, clock, coordinator};
}

async function readPointerCatalogId(
  storage: InMemoryKeyValueStorage,
): Promise<string | undefined> {
  const raw = (await storage.get([ACTIVE_POINTER_KEY]))[ACTIVE_POINTER_KEY];
  return (raw as {catalogId?: string} | undefined)?.catalogId;
}

async function readCatalogEntries(
  sync: InMemoryKeyValueStorage,
): Promise<{id: string; name: string; pattern: string | null}[]> {
  const catalogId = await readPointerCatalogId(sync);
  if (!catalogId) return [];
  const rootKey = catalogRootKey(catalogId);
  const root = (await sync.get([rootKey]))[rootKey] as {
    shardIds: string[];
  };
  const entries: {id: string; name: string; pattern: string | null}[] = [];
  for (const shardId of root.shardIds) {
    const key = catalogShardKey(shardId);
    const shard = (await sync.get([key]))[key] as {
      entries: {id: string; name: string; pattern: string | null}[];
    };
    entries.push(...shard.entries);
  }
  return entries;
}

async function catchAsync(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

test('legacy key missing seeds defaultFunctions and marks legacyExisted false', async () => {
  const {sync, local, coordinator} = makeHarness();

  await coordinator.migrate();

  expect(await readPointerCatalogId(sync)).toBeDefined();
  const entries = await readCatalogEntries(sync);
  expect(entries.map(e => e.id)).toEqual(defaultFunctions.map(f => f.id));

  const resultRaw = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(resultRaw.legacyExisted).toBe(false);
  expect(resultRaw.outcome).toBe('completed');
  expect(resultRaw.migratedCount).toBe(defaultFunctions.length);

  // No backup should be written when there was nothing to back up.
  expect(
    (await local.get([LEGACY_BACKUP_KEY]))[LEGACY_BACKUP_KEY],
  ).toBeUndefined();
});

test('legacy empty array migrates to an empty, active FunctionStore', async () => {
  const {sync, local, coordinator} = makeHarness();
  await sync.set({[LEGACY_FUNCTIONS_KEY]: []});

  await coordinator.migrate();

  expect(await readPointerCatalogId(sync)).toBeDefined();
  const entries = await readCatalogEntries(sync);
  expect(entries).toEqual([]);

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.outcome).toBe('completed');
  expect(result.legacyExisted).toBe(true);
  expect(result.migratedCount).toBe(0);
});

test('normal legacy data migrates preserving content and order', async () => {
  const {sync, coordinator} = makeHarness();
  const fns = [makeFunction('a'), makeFunction('b'), makeFunction('c')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});

  await coordinator.migrate();

  const repo = createFunctionRepository({storage: sync});
  const refs = await repo.list();
  expect(refs.map(r => r.id)).toEqual(['a', 'b', 'c']);
  for (const [i, ref] of refs.entries()) {
    expect(await repo.get(ref)).toEqual(fns[i]);
  }
});

test('legacy data that is not an array aborts without creating a Pointer', async () => {
  const {sync, local, coordinator} = makeHarness();
  await sync.set({[LEGACY_FUNCTIONS_KEY]: {not: 'an array'}});

  const error = await catchAsync(() => coordinator.migrate());

  expect(error).toBeInstanceOf(MigrationError);
  expect(await readPointerCatalogId(sync)).toBeUndefined();
  expect(
    (await sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  ).toEqual({not: 'an array'});

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.outcome).toBe('failed');
  expect(result.error).toBeDefined();
});

test('FunctionStore items are not written until the legacy backup round-trip is verified', async () => {
  const {sync, local, coordinator} = makeHarness();
  await sync.set({[LEGACY_FUNCTIONS_KEY]: [makeFunction('a')]});

  local.failOnce('set');
  const error = await catchAsync(() => coordinator.migrate());

  expect(error).toBeInstanceOf(MigrationError);
  expect(await readPointerCatalogId(sync)).toBeUndefined();

  const syncSnapshot = sync.snapshot();
  const v1Keys = Object.keys(syncSnapshot).filter(k =>
    k.startsWith('cocopy:function-store:v1:'),
  );
  expect(v1Keys).toEqual([]);
});

test('10 legacy functions with 1 schema-invalid entry migrate the other 9', async () => {
  const {sync, local, coordinator} = makeHarness();
  const valid = Array.from({length: 9}, (_, i) => makeFunction(`f${i}`));
  const invalid = {
    id: 'bad',
    name: 'bad',
    code: 'x',
    version: 1,
    theme: {textColor: 'not-a-color', backgroundColor: '#ffffff'},
  };
  await sync.set({[LEGACY_FUNCTIONS_KEY]: [...valid, invalid]});

  await coordinator.migrate();

  const entries = await readCatalogEntries(sync);
  expect(entries.map(e => e.id)).toEqual(valid.map(f => f.id));

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.migratedCount).toBe(9);
  expect(result.skipped).toEqual([{id: 'bad', name: 'bad', reason: 'schema'}]);
});

test('duplicate logical ids are renamed on the second occurrence and recorded', async () => {
  const {sync, local, coordinator} = makeHarness();
  const a1 = makeFunction('dup', {name: 'first'});
  const a2 = makeFunction('dup', {name: 'second'});
  await sync.set({[LEGACY_FUNCTIONS_KEY]: [a1, a2]});

  await coordinator.migrate();

  const entries = await readCatalogEntries(sync);
  expect(entries).toHaveLength(2);
  expect(entries[0].id).toBe('dup');
  expect(entries[0].name).toBe('first');
  expect(entries[1].id).not.toBe('dup');
  expect(entries[1].name).toBe('second');

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.renamedIds).toHaveLength(1);
  expect(result.renamedIds[0].from).toBe('dup');
  expect(result.renamedIds[0].to).toBe(entries[1].id);
});

test('an oversized function is skipped with reason size', async () => {
  const {sync, local, coordinator} = makeHarness();
  const huge = makeFunction('huge', {code: 'x'.repeat(8_000)});
  const small = makeFunction('small');
  await sync.set({[LEGACY_FUNCTIONS_KEY]: [huge, small]});

  await coordinator.migrate();

  const entries = await readCatalogEntries(sync);
  expect(entries.map(e => e.id)).toEqual(['small']);

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.skipped).toEqual([
    {id: 'huge', name: 'name-huge', reason: 'size'},
  ]);
});

test('an invalid URL pattern is skipped with reason pattern', async () => {
  const {sync, local, coordinator} = makeHarness();
  const badPattern = makeFunction('bad-pattern', {pattern: '(['});
  await sync.set({[LEGACY_FUNCTIONS_KEY]: [badPattern]});

  await coordinator.migrate();

  const entries = await readCatalogEntries(sync);
  expect(entries).toEqual([]);

  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.skipped).toEqual([
    {id: 'bad-pattern', name: 'name-bad-pattern', reason: 'pattern'},
  ]);
});

test('a failed FunctionStore write leaves legacy data and Pointer untouched, and a retry succeeds', async () => {
  const {sync, coordinator} = makeHarness();
  const fns = [makeFunction('a'), makeFunction('b')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});

  sync.failOnce('set');
  const error = await catchAsync(() => coordinator.migrate());

  expect(error).toBeInstanceOf(MigrationError);
  expect(await readPointerCatalogId(sync)).toBeUndefined();
  expect(
    (await sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  ).toEqual(fns);

  // Retry: same coordinator, no more injected failure.
  await coordinator.migrate();
  expect(await readPointerCatalogId(sync)).toBeDefined();
  const entries = await readCatalogEntries(sync);
  expect(entries.map(e => e.id)).toEqual(['a', 'b']);
});

test('a failed Pointer write leaves legacy data untouched, and a retry succeeds', async () => {
  const {sync, coordinator} = makeHarness();
  const fns = [makeFunction('a')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});

  // First `set` call writes documents/shards/root; second writes the Pointer.
  let setCalls = 0;
  const originalSet = sync.set.bind(sync);
  const spy = async (items: Record<string, unknown>) => {
    setCalls += 1;
    if (setCalls === 2) throw new Error('injected failure: pointer set');
    await originalSet(items);
  };
  sync.set = spy;

  const error = await catchAsync(() => coordinator.migrate());
  expect(error).toBeInstanceOf(MigrationError);
  expect(await readPointerCatalogId(sync)).toBeUndefined();

  sync.set = originalSet;
  await coordinator.migrate();
  expect(await readPointerCatalogId(sync)).toBeDefined();
});

test('migrate is a no-op once the Active Pointer already exists', async () => {
  const {sync, coordinator} = makeHarness();
  await sync.set({
    [LEGACY_FUNCTIONS_KEY]: [makeFunction('should-not-be-read')],
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'existing'},
  });

  const getSpy: string[][] = [];
  const originalGet = sync.get.bind(sync);
  sync.get = async (keys: string[]) => {
    getSpy.push(keys);
    return originalGet(keys);
  };

  await coordinator.migrate();

  expect(await readPointerCatalogId(sync)).toBe('existing');
  const readLegacyKeys = getSpy.some(keys =>
    keys.includes(LEGACY_FUNCTIONS_KEY),
  );
  expect(readLegacyKeys).toBe(false);
});

test('createFunctionRepository with onMissingActivePointer runs migration transparently', async () => {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  const clock = new TestClock(BASE_TIME);
  const fns = [makeFunction('a'), makeFunction('b')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});

  const coordinator = createMigrationCoordinator({
    sync,
    local,
    now: clock.now,
    newId: sequentialIds(),
  });
  const repo = createFunctionRepository({
    storage: sync,
    onMissingActivePointer: coordinator.migrate,
  });

  const refs = await repo.list();
  expect(refs.map(r => r.id)).toEqual(['a', 'b']);
  for (const [i, ref] of refs.entries()) {
    expect(await repo.get(ref)).toEqual(fns[i]);
  }
});

test('createLegacyBackupRepository.status reports legacy raw, backup, and result', async () => {
  const {sync, local, coordinator} = makeHarness();
  const fns = [makeFunction('a')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});

  await coordinator.migrate();

  const legacyBackupRepo = createLegacyBackupRepository({sync, local});
  const status = await legacyBackupRepo.status();

  expect(status.legacyRaw).toBe(JSON.stringify(fns));
  expect(status.backupRaw).toBe(JSON.stringify(fns));
  expect(status.result?.outcome).toBe('completed');
  expect(status.result?.migratedCount).toBe(1);
});

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(source)
        .sort()
        .map(key => [key, sortKeysDeep(source[key])]),
    );
  }
  return value;
}

/**
 * chrome.storage round-trips values through its own serializer and returns
 * objects with keys sorted alphabetically. InMemoryKeyValueStorage preserves
 * insertion order, which let a stringify-based read-back comparison pass in
 * tests while failing on real storage.
 */
class KeySortingStorage extends InMemoryKeyValueStorage {
  override async get(keys: string[]): Promise<Record<string, unknown>> {
    return sortKeysDeep(await super.get(keys)) as Record<string, unknown>;
  }
  override async getAll(): Promise<Record<string, unknown>> {
    return sortKeysDeep(await super.getAll()) as Record<string, unknown>;
  }
}

test('migration succeeds when storage returns objects with sorted keys like chrome.storage', async () => {
  const sync = new KeySortingStorage();
  const local = new InMemoryKeyValueStorage();
  const clock = new TestClock();
  const coordinator = createMigrationCoordinator({
    sync,
    local,
    now: clock.now,
    newId: sequentialIds(),
  });
  await sync.set({
    [LEGACY_FUNCTIONS_KEY]: [makeFunction('a'), makeFunction('b')],
  });

  await coordinator.migrate();

  expect(await readPointerCatalogId(sync)).toBeDefined();
  expect((await readCatalogEntries(sync)).map(e => e.id)).toEqual(['a', 'b']);
  const result = (await local.get([MIGRATION_RESULT_KEY]))[
    MIGRATION_RESULT_KEY
  ] as MigrationResult;
  expect(result.outcome).toBe('completed');
});

test('createLegacyBackupRepository.status reports undefined fields when nothing is present', async () => {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  const legacyBackupRepo = createLegacyBackupRepository({sync, local});

  const status = await legacyBackupRepo.status();

  expect(status.legacyRaw).toBeUndefined();
  expect(status.backupRaw).toBeUndefined();
  expect(status.result).toBeUndefined();
});

test('deleteEntry removes the entry from both the backup and the legacy sync value', async () => {
  // KeySortingStorage: the sync copy comes back with reordered keys, so the
  // cross-store match must be structural, not positional or string-based.
  const sync = new KeySortingStorage();
  const local = new InMemoryKeyValueStorage();
  const fns = [makeFunction('a'), makeFunction('b'), makeFunction('c')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});
  await local.set({[LEGACY_BACKUP_KEY]: JSON.stringify(fns)});
  const legacyBackupRepo = createLegacyBackupRepository({sync, local});

  await legacyBackupRepo.deleteEntry(1);

  const backupRaw = (await local.get([LEGACY_BACKUP_KEY]))[
    LEGACY_BACKUP_KEY
  ] as string;
  expect((JSON.parse(backupRaw) as CopyFunction[]).map(fn => fn.id)).toEqual([
    'a',
    'c',
  ]);
  const legacy = (await sync.get([LEGACY_FUNCTIONS_KEY]))[
    LEGACY_FUNCTIONS_KEY
  ] as CopyFunction[];
  expect(legacy.map(fn => fn.id)).toEqual(['a', 'c']);
});

test('deleteEntry works when only the legacy sync value exists', async () => {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  const fns = [makeFunction('a'), makeFunction('b')];
  await sync.set({[LEGACY_FUNCTIONS_KEY]: fns});
  const legacyBackupRepo = createLegacyBackupRepository({sync, local});

  await legacyBackupRepo.deleteEntry(0);

  const legacy = (await sync.get([LEGACY_FUNCTIONS_KEY]))[
    LEGACY_FUNCTIONS_KEY
  ] as CopyFunction[];
  expect(legacy.map(fn => fn.id)).toEqual(['b']);
  expect(
    (await local.get([LEGACY_BACKUP_KEY]))[LEGACY_BACKUP_KEY],
  ).toBeUndefined();
});

test('deleteEntry throws on an index outside the displayed array', async () => {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  await local.set({[LEGACY_BACKUP_KEY]: JSON.stringify([makeFunction('a')])});
  const legacyBackupRepo = createLegacyBackupRepository({sync, local});

  const error = await catchAsync(() => legacyBackupRepo.deleteEntry(1));
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(/no longer exists/);

  // Nothing was written.
  const backupRaw = (await local.get([LEGACY_BACKUP_KEY]))[
    LEGACY_BACKUP_KEY
  ] as string;
  expect(JSON.parse(backupRaw)).toEqual([makeFunction('a')]);
});
