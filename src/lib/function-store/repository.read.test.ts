import {vi} from 'vitest';

import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
} from './keys';
import {InMemoryKeyValueStorage} from './memory-storage';
import {createFunctionRepository, SNAPSHOT_CACHE_KEY} from './repository';
import {
  BASE_TIME,
  catchAsync,
  createHarness,
  makeFunction,
  seedSnapshot,
} from './repository.test-helpers';
import {
  CorruptionError,
  refFromFunction,
  UnsupportedVersionError,
} from './types';

test('list returns entries in root shard order then entry order', async () => {
  const {storage, repo} = createHarness();
  const fns = ['a', 'b', 'c', 'd'].map(id => makeFunction(id));
  await seedSnapshot(storage, fns, {entriesPerShard: 2});

  const refs = await repo.list();

  expect(refs.map(r => r.id)).toEqual(['a', 'b', 'c', 'd']);
  expect(refs[0]).toEqual(refFromFunction(fns[0], 'seed-doc-1'));
});

test('listForUrl filters by pattern and never reads Function Documents', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [
    makeFunction('always'),
    makeFunction('github', {pattern: '^https://github\\.com/'}),
    makeFunction('example', {pattern: '^https://example\\.com/'}),
  ]);

  const getSpy = vi.spyOn(storage, 'get');
  const refs = await repo.listForUrl('https://github.com/pokutuna');

  expect(refs.map(r => r.id)).toEqual(['always', 'github']);

  const readKeys = getSpy.mock.calls.flatMap(call => call[0]);
  expect(readKeys.some(key => key.includes(':function:'))).toBe(false);
});

test('listForUrl drops entries whose pattern is not a valid RegExp', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('ok'), makeFunction('broken')]);

  // Corrupt one entry's pattern after the fact: patterns are validated on
  // write, so only foreign writes can produce this.
  const shardKey = catalogShardKey('seed-shard-1');
  const shard = (await storage.get([shardKey]))[shardKey] as {
    entries: {id: string; pattern: string | null}[];
  };
  shard.entries[1].pattern = '([';
  await storage.set({[shardKey]: shard});

  const refs = await repo.listForUrl('https://example.com/');

  expect(refs.map(r => r.id)).toEqual(['ok']);
});

test('get reads only the referenced document and validates it', async () => {
  const {storage, repo} = createHarness();
  const fns = [makeFunction('a'), makeFunction('b')];
  await seedSnapshot(storage, fns);

  const refs = await repo.list();
  const getSpy = vi.spyOn(storage, 'get');
  const fn = await repo.get(refs[1]);

  expect(fn).toEqual(fns[1]);
  expect(getSpy).toHaveBeenCalledTimes(1);
  expect(getSpy).toHaveBeenCalledWith([functionDocumentKey('seed-doc-2')]);
});

test('get returns undefined when the document is gone', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const [ref] = await repo.list();

  await storage.remove([functionDocumentKey(ref.documentId)]);

  expect(await repo.get(ref)).toBeUndefined();
});

test('get throws CorruptionError when the document disagrees with the ref', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const [ref] = await repo.list();

  const key = functionDocumentKey(ref.documentId);
  const doc = (await storage.get([key]))[key] as {
    function: {id: string; name: string};
  };
  // Point the document at a different logical function than the catalog says.
  doc.function.id = 'someone-else';
  doc.function.name = 'someone else';
  await storage.set({[key]: doc});

  await expect(repo.get(ref)).rejects.toThrow(CorruptionError);
});

test('get throws CorruptionError when the document fails schema validation', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const [ref] = await repo.list();

  await storage.set({
    [functionDocumentKey(ref.documentId)]: {formatVersion: 1, nope: true},
  });

  await expect(repo.get(ref)).rejects.toThrow(CorruptionError);
});

test('reading throws UnsupportedVersionError for a newer pointer format', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 2, catalogId: 'seed-catalog'},
  });

  const error = await catchAsync(() => repo.list());

  expect(error).toBeInstanceOf(UnsupportedVersionError);
  expect((error as UnsupportedVersionError).formatVersion).toBe(2);
});

test('reading throws CorruptionError when the pointer formatVersion is not 1', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 0, catalogId: 'seed-catalog'},
  });

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('reading throws CorruptionError for a malformed pointer', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({[ACTIVE_POINTER_KEY]: {catalogId: 'seed-catalog'}});

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('reading throws CorruptionError when the pointer is missing and no hook is set', async () => {
  const {repo} = createHarness();

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('a missing pointer runs the migration hook exactly once', async () => {
  const storage = new InMemoryKeyValueStorage();
  const onMissingActivePointer = vi.fn(async () => {
    await seedSnapshot(storage, [makeFunction('migrated')]);
  });
  const {repo} = createHarness({storage, onMissingActivePointer});

  expect((await repo.list()).map(r => r.id)).toEqual(['migrated']);
  expect((await repo.list()).map(r => r.id)).toEqual(['migrated']);
  expect(onMissingActivePointer).toHaveBeenCalledTimes(1);
});

test('the migration hook runs even when the first operation is a mutation', async () => {
  // Regression: the hook used to be enqueued on the mutation queue, which
  // deadlocked when reached from inside an already-enqueued mutation.
  const storage = new InMemoryKeyValueStorage();
  const onMissingActivePointer = vi.fn(async () => {
    await seedSnapshot(storage, []);
  });
  const {repo} = createHarness({storage, onMissingActivePointer});

  await repo.create(makeFunction('first'));

  expect((await repo.list()).map(r => r.id)).toEqual(['first']);
  expect(onMissingActivePointer).toHaveBeenCalledTimes(1);
});

test('a migration hook that writes nothing still surfaces CorruptionError once', async () => {
  const onMissingActivePointer = vi.fn(async () => {});
  const {repo} = createHarness({onMissingActivePointer});

  await expect(repo.list()).rejects.toThrow(CorruptionError);
  await expect(repo.list()).rejects.toThrow(CorruptionError);
  expect(onMissingActivePointer).toHaveBeenCalledTimes(1);
});

test('detects a catalog whose root belongs to a different catalogId', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const rootKey = catalogRootKey('seed-catalog');
  const root = (await storage.get([rootKey]))[rootKey] as {catalogId: string};
  root.catalogId = 'other-catalog';
  await storage.set({[rootKey]: root});

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('detects duplicate logical ids across shards', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')], {
    entriesPerShard: 1,
  });

  const shardKey = catalogShardKey('seed-shard-2');
  const shard = (await storage.get([shardKey]))[shardKey] as {
    entries: {id: string}[];
  };
  shard.entries[0].id = 'a';
  await storage.set({[shardKey]: shard});

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('detects duplicate documentIds across shards', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')], {
    entriesPerShard: 1,
  });

  const shardKey = catalogShardKey('seed-shard-2');
  const shard = (await storage.get([shardKey]))[shardKey] as {
    entries: {documentId: string}[];
  };
  shard.entries[0].documentId = 'seed-doc-1';
  await storage.set({[shardKey]: shard});

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('a fully validated snapshot is written to the cache', async () => {
  const {storage, cache, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await repo.list();

  const cached = (await cache.get([SNAPSHOT_CACHE_KEY]))[
    SNAPSHOT_CACHE_KEY
  ] as {
    formatVersion: number;
    catalogId: string;
    shards: {entries: {id: string}[]}[];
  };
  expect(cached.formatVersion).toBe(1);
  expect(cached.catalogId).toBe('seed-catalog');
  expect(cached.shards[0].entries.map(e => e.id)).toEqual(['a']);
});

test('returns the cached snapshot when only the pointer has synced', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await repo.list(); // populates the cache

  // A newer pointer arrives before its root/shards.
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'not-yet-synced'},
  });

  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});

test('an incomplete snapshot without a cache is CorruptionError', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'not-yet-synced'},
  });

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('a shard that has not synced yet falls back to the cache', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')], {
    entriesPerShard: 1,
  });
  await repo.list();

  await storage.remove([catalogShardKey('seed-shard-2')]);

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b']);
});

test('an invalid cache value is ignored', async () => {
  const {storage, cache, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await cache.set({[SNAPSHOT_CACHE_KEY]: {formatVersion: 1, nope: true}});
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'not-yet-synced'},
  });

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});

test('caching is disabled when no cache storage is provided', async () => {
  const storage = new InMemoryKeyValueStorage();
  const repo = createFunctionRepository({storage, now: () => BASE_TIME});
  await seedSnapshot(storage, [makeFunction('a')]);
  await repo.list();

  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'not-yet-synced'},
  });

  await expect(repo.list()).rejects.toThrow(CorruptionError);
});
