import {vi} from 'vitest';

import {ACTIVE_POINTER_KEY, catalogRootKey, catalogShardKey} from './keys';
import {InMemoryKeyValueStorage} from './memory-storage';
import {createFunctionRepository, GC_GRACE_MS} from './repository';
import {
  catchAsync,
  createHarness,
  makeFunction,
  readPointerCatalogId,
  seedSnapshot,
  sequentialIds,
} from './repository.test-helpers';
import {
  EFFECTIVE_ITEM_BYTES,
  EFFECTIVE_MAX_ITEMS,
  EFFECTIVE_TOTAL_BYTES,
  MAX_FUNCTIONS,
} from './size';
import {
  ConflictError,
  CopyFunctionRef,
  CorruptionError,
  QuotaError,
  refFromFunction,
  ValidationError,
} from './types';

test('create appends a function and keeps existing order', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')]);

  await repo.create(makeFunction('c'));

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b', 'c']);
  const created = (await repo.list())[2];
  expect(await repo.get(created)).toEqual(makeFunction('c'));
});

test('create publishes a new catalogId', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await repo.create(makeFunction('b'));

  expect(await readPointerCatalogId(storage)).not.toBe('seed-catalog');
});

test('create rejects a duplicate logical id', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await expect(repo.create(makeFunction('a'))).rejects.toThrow(ValidationError);
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
});

test('create rejects a function that fails schema validation', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  const invalid = makeFunction('bad', {
    theme: {textColor: 'not-a-color', backgroundColor: '#ffffff'},
  });

  await expect(repo.create(invalid)).rejects.toThrow(ValidationError);
});

test('create rejects a pattern that is not a valid RegExp', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  await expect(
    repo.create(makeFunction('bad', {pattern: '(['})),
  ).rejects.toThrow(ValidationError);
});

test('create rejects a function larger than the effective item limit', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  const huge = makeFunction('huge', {code: 'x'.repeat(EFFECTIVE_ITEM_BYTES)});
  const error = await catchAsync(() => repo.create(huge));

  expect(error).toBeInstanceOf(QuotaError);
  expect((error as QuotaError).details.limitKind).toBe('item-bytes');
});

test('create rejects once the function count limit is reached', async () => {
  const {storage, repo} = createHarness();
  const fns = Array.from({length: MAX_FUNCTIONS}, (_, i) =>
    makeFunction(`f${i}`),
  );
  await seedSnapshot(storage, fns, {entriesPerShard: 20});

  const setSpy = vi.spyOn(storage, 'set');
  const error = await catchAsync(() => repo.create(makeFunction('one-more')));

  expect(error).toBeInstanceOf(QuotaError);
  expect((error as QuotaError).details.limitKind).toBe('function-count');
  expect(setSpy).not.toHaveBeenCalled();
});

test('update replaces the entry in place and writes a new document', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [
    makeFunction('a'),
    makeFunction('b'),
    makeFunction('c'),
  ]);

  await repo.update(makeFunction('b', {name: 'renamed', code: 'return 2;'}));

  const refs = await repo.list();
  expect(refs.map(r => r.id)).toEqual(['a', 'b', 'c']);
  expect(refs[1].name).toBe('renamed');
  expect(refs[1].documentId).not.toBe('seed-doc-2');
  expect(await repo.get(refs[1])).toEqual(
    makeFunction('b', {name: 'renamed', code: 'return 2;'}),
  );
});

test('update of a function that no longer exists is a ConflictError', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await expect(repo.update(makeFunction('gone'))).rejects.toThrow(
    ConflictError,
  );
});

test('update with the current base documentId succeeds', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const [ref] = await repo.list();

  await repo.update(makeFunction('a', {name: 'renamed'}), ref.documentId);

  expect((await repo.list())[0].name).toBe('renamed');
});

test('update with a stale base documentId is a ConflictError', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const [ref] = await repo.list();

  // Another window saves the same function after this editor loaded it.
  await repo.update(makeFunction('a', {name: 'theirs'}));

  await expect(
    repo.update(makeFunction('a', {name: 'ours'}), ref.documentId),
  ).rejects.toThrow(ConflictError);
  expect((await repo.list())[0].name).toBe('theirs');
});

test('update without a base documentId stays last-write-wins', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await repo.update(makeFunction('a', {name: 'first'}));
  await repo.update(makeFunction('a', {name: 'second'}));

  expect((await repo.list())[0].name).toBe('second');
});

test('delete removes the entry and keeps the rest in order', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(
    storage,
    ['a', 'b', 'c'].map(id => makeFunction(id)),
  );

  await repo.delete('b');

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'c']);
});

test('delete of an unknown id succeeds without writing', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const setSpy = vi.spyOn(storage, 'set');
  await expect(repo.delete('never-existed')).resolves.toBeUndefined();

  expect(setSpy).not.toHaveBeenCalled();
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
});

test('reorder changes order without replacing documents', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(
    storage,
    ['a', 'b', 'c'].map(id => makeFunction(id)),
  );
  const before = await repo.list();

  await repo.reorder(['c', 'a', 'b']);

  const after = await repo.list();
  expect(after.map(r => r.id)).toEqual(['c', 'a', 'b']);
  expect(after.map(r => r.documentId)).toEqual([
    before[2].documentId,
    before[0].documentId,
    before[1].documentId,
  ]);
});

test('reorder rejects an id set that does not match the catalog', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(
    storage,
    ['a', 'b'].map(id => makeFunction(id)),
  );

  await expect(repo.reorder(['a'])).rejects.toThrow(ConflictError);
  await expect(repo.reorder(['a', 'b', 'c'])).rejects.toThrow(ConflictError);
  await expect(repo.reorder(['a', 'a'])).rejects.toThrow(ConflictError);
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
});

test('mutations are serialized so concurrent creates all land', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  await Promise.all([
    repo.create(makeFunction('a')),
    repo.create(makeFunction('b')),
    repo.create(makeFunction('c')),
  ]);

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b', 'c']);
});

test('a failed document/catalog write leaves the old snapshot readable', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  storage.failOnce('set');
  await expect(repo.create(makeFunction('b'))).rejects.toThrow(
    'injected failure: set',
  );

  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});

test('a failed read-back aborts the commit before the pointer moves', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // Fail the read-back that follows the document/catalog write (step 4),
  // not the earlier reads that establish the base snapshot.
  const originalGet = storage.get.bind(storage);
  const originalSet = storage.set.bind(storage);
  let written = false;
  vi.spyOn(storage, 'set').mockImplementation(async items => {
    await originalSet(items);
    written = true;
  });
  vi.spyOn(storage, 'get').mockImplementation(async keys => {
    if (written) throw new Error('injected failure: read-back');
    return originalGet(keys);
  });

  await expect(repo.create(makeFunction('b'))).rejects.toThrow(
    'injected failure: read-back',
  );

  vi.restoreAllMocks();
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});

test('a missing item at read-back aborts with CorruptionError', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // Simulate a write that silently dropped the new document.
  const originalSet = storage.set.bind(storage);
  vi.spyOn(storage, 'set').mockImplementation(async items => {
    const kept = Object.fromEntries(
      Object.entries(items).filter(([key]) => !key.includes(':function:')),
    );
    await originalSet(kept);
  });

  await expect(repo.create(makeFunction('b'))).rejects.toThrow(CorruptionError);

  vi.restoreAllMocks();
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});

test('a failed pointer write leaves the old snapshot readable', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // The first `set` writes documents + catalog; the second writes the pointer.
  let setCalls = 0;
  const originalSet = storage.set.bind(storage);
  vi.spyOn(storage, 'set').mockImplementation(async items => {
    setCalls += 1;
    if (setCalls === 2) throw new Error('injected failure: pointer set');
    await originalSet(items);
  });

  await expect(repo.create(makeFunction('b'))).rejects.toThrow(
    'injected failure: pointer set',
  );

  vi.restoreAllMocks();
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});

test('two writers on the same base snapshot: the later one conflicts', async () => {
  const shared = new InMemoryKeyValueStorage();
  await seedSnapshot(shared, [makeFunction('a')]);

  const writerA = createFunctionRepository({
    storage: shared,
    newId: sequentialIds('a'),
  });

  // writerB reads its base, then writerA commits before writerB's own write
  // reaches the pointer. Hooking B's first `set` reproduces that interleaving
  // deterministically.
  let interleaved = false;
  const originalSet = shared.set.bind(shared);
  const stallingStorage: typeof shared = Object.create(shared);
  stallingStorage.set = async (items: Record<string, unknown>) => {
    await originalSet(items);
    if (!interleaved) {
      interleaved = true;
      await writerA.create(makeFunction('from-a'));
    }
  };

  const writerB = createFunctionRepository({
    storage: stallingStorage,
    newId: sequentialIds('b'),
  });

  await expect(writerB.create(makeFunction('from-b'))).rejects.toThrow(
    ConflictError,
  );

  // A's snapshot is the published one; B wrote no pointer.
  const refs = await writerA.list();
  expect(refs.map(r => r.id)).toEqual(['a', 'from-a']);
});

test('a concurrent pointer change between planning and commit is a ConflictError', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // Another context publishes a snapshot after we captured our base but
  // before we write the pointer.
  const originalSet = storage.set.bind(storage);
  let hijacked = false;
  vi.spyOn(storage, 'set').mockImplementation(async items => {
    await originalSet(items);
    if (!hijacked && !(ACTIVE_POINTER_KEY in items)) {
      hijacked = true;
      await originalSet({
        [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'foreign-catalog'},
      });
    }
  });

  await expect(repo.create(makeFunction('b'))).rejects.toThrow(ConflictError);

  vi.restoreAllMocks();
  expect(await readPointerCatalogId(storage)).toBe('foreign-catalog');
});

test('a mutation over the total byte limit never writes', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  // Fill non-FunctionStore space so the peak estimate blows past the limit.
  await storage.set({filler: 'x'.repeat(EFFECTIVE_TOTAL_BYTES)});

  const setSpy = vi.spyOn(storage, 'set');
  const error = await catchAsync(() => repo.create(makeFunction('a')));

  expect(error).toBeInstanceOf(QuotaError);
  expect((error as QuotaError).details.limitKind).toBe('total-bytes');
  expect(setSpy).not.toHaveBeenCalled();
  expect(await readPointerCatalogId(storage)).toBe('seed-catalog');
});

test('a mutation over the item count limit never writes', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);

  const filler: Record<string, unknown> = {};
  for (let i = 0; i < EFFECTIVE_MAX_ITEMS; i++) filler[`other-${i}`] = i;
  await storage.set(filler);

  const setSpy = vi.spyOn(storage, 'set');
  const error = await catchAsync(() => repo.create(makeFunction('a')));

  expect(error).toBeInstanceOf(QuotaError);
  expect((error as QuotaError).details.limitKind).toBe('item-count');
  expect(setSpy).not.toHaveBeenCalled();
});

test('GC frees space so a mutation that would not fit can proceed', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // Orphan documents that alone push the estimate over the limit.
  const orphans: Record<string, unknown> = {};
  for (let i = 0; i < 20; i++) {
    orphans[`cocopy:function-store:v1:function:orphan-${i}`] = {
      formatVersion: 1,
      documentId: `orphan-${i}`,
      createdAt: clock.now().toISOString(),
      function: makeFunction(`orphan-${i}`, {code: 'y'.repeat(4000)}),
    };
  }
  await storage.set(orphans);
  clock.advance(11 * 60 * 1000);

  await repo.create(makeFunction('b'));

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b']);
  const remaining = Object.keys(storage.snapshot()).filter(k =>
    k.includes('orphan-'),
  );
  expect(remaining).toEqual([]);
});

test('multi-shard catalogs preserve order and ref contents', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, []);

  // ~8 KiB of entries forces the catalog across several shards without
  // depending on a shrunken EFFECTIVE_ITEM_BYTES.
  const fns = Array.from({length: 60}, (_, i) =>
    makeFunction(`f${String(i).padStart(3, '0')}`, {
      name: `function name number ${i} `.repeat(4),
      pattern: `^https://example\\.com/section-${i}/`,
    }),
  );
  for (const fn of fns) {
    await repo.create(fn);
    // Age each superseded catalog past the GC grace period so the
    // copy-on-write leftovers of 60 sequential commits do not fill storage.
    clock.advance(GC_GRACE_MS + 1);
  }

  const catalogId = await readPointerCatalogId(storage);
  const rootKey = catalogRootKey(catalogId as string);
  const root = (await storage.get([rootKey]))[rootKey] as {shardIds: string[]};
  expect(root.shardIds.length).toBeGreaterThan(1);

  const refs = await repo.list();
  expect(refs.map(r => r.id)).toEqual(fns.map(f => f.id));
  for (const [i, ref] of refs.entries()) {
    expect(ref).toEqual(refFromFunction(fns[i], ref.documentId));
    expect(await repo.get(ref)).toEqual(fns[i]);
  }

  // Reordering across shard boundaries keeps every ref intact.
  const reversedIds = [...refs].reverse().map(r => r.id);
  await repo.reorder(reversedIds);
  const reordered = await repo.list();
  expect(reordered.map(r => r.id)).toEqual(reversedIds);
  expect(sortRefs(reordered)).toEqual(sortRefs(refs));
});

function sortRefs(refs: CopyFunctionRef[]): CopyFunctionRef[] {
  return [...refs].sort((a, b) => a.id.localeCompare(b.id));
}

test('a shard that stays under 8 KiB is never split unnecessarily', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, []);
  await repo.create(makeFunction('only'));

  const catalogId = await readPointerCatalogId(storage);
  const rootKey = catalogRootKey(catalogId as string);
  const root = (await storage.get([rootKey]))[rootKey] as {shardIds: string[]};

  expect(root.shardIds).toHaveLength(1);
  expect(catalogShardKey(root.shardIds[0]) in storage.snapshot()).toBe(true);
});
