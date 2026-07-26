import {vi} from 'vitest';

import {ACTIVE_POINTER_KEY, functionDocumentKey} from './keys';
import {
  createHarness,
  flush,
  makeFunction,
  seedSnapshot,
} from './repository.test-helpers';

test('a local commit notifies listeners exactly once', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const listener = vi.fn();
  repo.subscribe(listener);

  await repo.create(makeFunction('b'));
  await flush();

  expect(listener).toHaveBeenCalledTimes(1);
});

test('a pointer change from another context notifies listeners', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await repo.list();

  const listener = vi.fn();
  repo.subscribe(listener);

  await seedSnapshot(storage, [makeFunction('remote')], {
    catalogId: 'remote-catalog',
    documentIds: ['remote-doc'],
  });
  await flush();

  expect(listener).toHaveBeenCalledTimes(1);
  expect((await repo.list()).map(r => r.id)).toEqual(['remote']);
});

test('changes that do not touch the pointer are ignored', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await repo.list();

  const listener = vi.fn();
  repo.subscribe(listener);

  await storage.set({
    [functionDocumentKey('unrelated')]: {formatVersion: 1},
    'some-other-key': 1,
  });
  await flush();

  expect(listener).not.toHaveBeenCalled();
});

test('a pointer write that does not change the catalogId is not re-notified', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  await repo.list();

  const listener = vi.fn();
  repo.subscribe(listener);

  await storage.set({
    [ACTIVE_POINTER_KEY]: {formatVersion: 1, catalogId: 'seed-catalog'},
  });
  await flush();

  expect(listener).not.toHaveBeenCalled();
});

test('unsubscribed listeners stop receiving notifications', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const listener = vi.fn();
  const unsubscribe = repo.subscribe(listener);
  unsubscribe();

  await repo.create(makeFunction('b'));
  await flush();

  expect(listener).not.toHaveBeenCalled();
});

test('unsubscribing twice is safe and does not drop other listeners', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const first = vi.fn();
  const second = vi.fn();
  const unsubscribeFirst = repo.subscribe(first);
  repo.subscribe(second);

  unsubscribeFirst();
  unsubscribeFirst();

  await repo.create(makeFunction('b'));
  await flush();

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});

test('storage is subscribed on the first listener and released on the last', async () => {
  const {storage, repo} = createHarness();
  const unsubscribeStorage = vi.fn();
  const subscribeSpy = vi
    .spyOn(storage, 'subscribe')
    .mockReturnValue(unsubscribeStorage);

  const unsubscribeA = repo.subscribe(vi.fn());
  const unsubscribeB = repo.subscribe(vi.fn());
  expect(subscribeSpy).toHaveBeenCalledTimes(1);

  unsubscribeA();
  expect(unsubscribeStorage).not.toHaveBeenCalled();

  unsubscribeB();
  expect(unsubscribeStorage).toHaveBeenCalledTimes(1);

  // Subscribing again re-attaches to storage.
  repo.subscribe(vi.fn());
  expect(subscribeSpy).toHaveBeenCalledTimes(2);
});

test('one throwing listener does not prevent the others from running', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  const throwing = vi.fn(() => {
    throw new Error('listener boom');
  });
  const healthy = vi.fn();
  repo.subscribe(throwing);
  repo.subscribe(healthy);

  await repo.create(makeFunction('b'));
  await flush();

  expect(throwing).toHaveBeenCalledTimes(1);
  expect(healthy).toHaveBeenCalledTimes(1);
  consoleError.mockRestore();
});

test('a failed commit does not notify listeners', async () => {
  const {storage, repo} = createHarness();
  await seedSnapshot(storage, [makeFunction('a')]);

  const listener = vi.fn();
  repo.subscribe(listener);

  storage.failOnce('set');
  await expect(repo.create(makeFunction('b'))).rejects.toThrow(
    'injected failure: set',
  );
  await flush();

  expect(listener).not.toHaveBeenCalled();
});
