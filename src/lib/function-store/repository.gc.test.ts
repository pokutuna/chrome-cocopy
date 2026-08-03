import {vi} from 'vitest';

import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
} from './keys';
import {GC_GRACE_MS} from './repository';
import {
  createHarness,
  makeFunction,
  readPointerCatalogId,
  seedSnapshot,
} from './repository.test-helpers';

function orphanDocument(id: string, createdAt: Date) {
  return {
    formatVersion: 1,
    documentId: id,
    createdAt: createdAt.toISOString(),
    function: makeFunction(id),
  };
}

test('gc removes unreachable documents, roots and shards past the grace period', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await storage.set({
    [functionDocumentKey('orphan-doc')]: orphanDocument(
      'orphan-doc',
      clock.now(),
    ),
    [catalogRootKey('orphan-catalog')]: {
      formatVersion: 1,
      catalogId: 'orphan-catalog',
      createdAt: clock.now().toISOString(),
      shardIds: ['orphan-shard'],
    },
    [catalogShardKey('orphan-shard')]: {
      formatVersion: 1,
      catalogId: 'orphan-catalog',
      shardId: 'orphan-shard',
      createdAt: clock.now().toISOString(),
      entries: [],
    },
  });

  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  const keys = Object.keys(storage.snapshot());
  expect(keys).not.toContain(functionDocumentKey('orphan-doc'));
  expect(keys).not.toContain(catalogRootKey('orphan-catalog'));
  expect(keys).not.toContain(catalogShardKey('orphan-shard'));
});

test('gc never removes items in the active snapshot', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')], {
    entriesPerShard: 1,
  });

  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b']);
  const keys = Object.keys(storage.snapshot());
  expect(keys).toContain(catalogRootKey('seed-catalog'));
  expect(keys).toContain(catalogShardKey('seed-shard-1'));
  expect(keys).toContain(catalogShardKey('seed-shard-2'));
  expect(keys).toContain(functionDocumentKey('seed-doc-1'));
  expect(keys).toContain(functionDocumentKey('seed-doc-2'));
});

test('gc keeps unreachable items that are still within the grace period', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [functionDocumentKey('fresh-orphan')]: orphanDocument(
      'fresh-orphan',
      clock.now(),
    ),
  });

  clock.advance(GC_GRACE_MS - 1);
  await repo.gc();

  expect(Object.keys(storage.snapshot())).toContain(
    functionDocumentKey('fresh-orphan'),
  );
});

test('gc never touches the pointer, legacy data or other extension keys', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    functions: [makeFunction('legacy')],
    'some-other-setting': {enabled: true},
    'cocopy:something-else': 'keep me',
  });

  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  const keys = Object.keys(storage.snapshot());
  expect(keys).toContain(ACTIVE_POINTER_KEY);
  expect(keys).toContain('functions');
  expect(keys).toContain('some-other-setting');
  expect(keys).toContain('cocopy:something-else');
});

test('gc keeps v1 items whose createdAt cannot be read', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [functionDocumentKey('no-created-at')]: {formatVersion: 1, garbage: true},
  });

  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  expect(Object.keys(storage.snapshot())).toContain(
    functionDocumentKey('no-created-at'),
  );
});

test('gc does not call remove when nothing is collectable', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  clock.advance(GC_GRACE_MS + 1);

  const removeSpy = vi.spyOn(storage, 'remove');
  await repo.gc();

  expect(removeSpy).not.toHaveBeenCalled();
});

test('gc re-reads the pointer so a newly synced snapshot survives', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  // A snapshot from another device, written long ago on that device's clock
  // and currently unreachable from our pointer.
  await seedSnapshot(storage, [makeFunction('remote')], {
    catalogId: 'remote-catalog',
    documentIds: ['remote-doc'],
  });
  // seedSnapshot also moved the pointer; move it back to simulate the
  // pointer arriving only after we begin scanning.
  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'seed-catalog'},
  });
  clock.advance(GC_GRACE_MS + 1);

  const originalGetAll = storage.getAll.bind(storage);
  vi.spyOn(storage, 'getAll').mockImplementation(async () => {
    const all = await originalGetAll();
    // The remote pointer lands between the scan and the delete.
    await storage.set({
      [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'remote-catalog'},
    });
    return all;
  });

  await repo.gc();
  vi.restoreAllMocks();

  expect(await readPointerCatalogId(storage)).toBe('remote-catalog');
  const keys = Object.keys(storage.snapshot());
  expect(keys).toContain(functionDocumentKey('remote-doc'));
  expect(keys).toContain(catalogRootKey('remote-catalog'));
});

test('gc failures are swallowed', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({
    [functionDocumentKey('orphan-doc')]: orphanDocument(
      'orphan-doc',
      clock.now(),
    ),
  });
  clock.advance(GC_GRACE_MS + 1);

  storage.failOnce('getAll');

  await expect(repo.gc()).resolves.toBeUndefined();
  expect(Object.keys(storage.snapshot())).toContain(
    functionDocumentKey('orphan-doc'),
  );
});

test('a commit leaves the superseded catalog collectable once it ages out', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  await repo.create(makeFunction('b'));

  // The old root/shard are unreachable but still fresh.
  expect(Object.keys(storage.snapshot())).toContain(
    catalogRootKey('seed-catalog'),
  );

  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  const keys = Object.keys(storage.snapshot());
  expect(keys).not.toContain(catalogRootKey('seed-catalog'));
  expect(keys).not.toContain(catalogShardKey('seed-shard-1'));
  // The unchanged function's document is still referenced by the new catalog.
  expect(keys).toContain(functionDocumentKey('seed-doc-1'));
  expect((await repo.list()).map(r => r.id)).toEqual(['a', 'b']);
});

test('a deleted function document is collected after the grace period', async () => {
  const {storage, clock, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a'), makeFunction('b')]);

  await repo.delete('b');
  clock.advance(GC_GRACE_MS + 1);
  await repo.gc();

  expect(Object.keys(storage.snapshot())).not.toContain(
    functionDocumentKey('seed-doc-2'),
  );
  expect((await repo.list()).map(r => r.id)).toEqual(['a']);
});
