import {describe, expect, it, vi} from 'vitest';

import {InMemoryKeyValueStorage} from './memory-storage';

describe('InMemoryKeyValueStorage', () => {
  it('sets and gets multiple items in one call', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: 1, b: 'two'});
    expect(await storage.get(['a', 'b'])).toEqual({a: 1, b: 'two'});
  });

  it('omits keys that do not exist from get', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: 1});
    expect(await storage.get(['a', 'missing'])).toEqual({a: 1});
  });

  it('getAll returns every stored item', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: 1, b: 2});
    expect(await storage.getAll()).toEqual({a: 1, b: 2});
  });

  it('remove deletes the given keys', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: 1, b: 2});
    await storage.remove(['a']);
    expect(await storage.getAll()).toEqual({b: 2});
  });

  it('drops undefined nested properties like chrome.storage does', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: {x: 1, y: undefined}});
    expect(await storage.get(['a'])).toEqual({a: {x: 1}});
  });

  it('rejects set when a value is not JSON-serializable', async () => {
    const storage = new InMemoryKeyValueStorage();
    await expect(storage.set({a: undefined})).rejects.toThrow(
      'not JSON-serializable',
    );
    await expect(storage.set({a: () => {}})).rejects.toThrow(
      'not JSON-serializable',
    );
    expect(storage.itemCount()).toBe(0);
  });

  it('returns a value that is not the same reference as what was written', async () => {
    const storage = new InMemoryKeyValueStorage();
    const original = {nested: [1, 2, 3]};
    await storage.set({a: original});
    const {a} = await storage.get(['a']);
    expect(a).toEqual(original);
    expect(a).not.toBe(original);
  });

  it('notifies subscribers of changed keys after set resolves', async () => {
    const storage = new InMemoryKeyValueStorage();
    const listener = vi.fn();
    storage.subscribe(listener);

    await storage.set({a: 1, b: 2});
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(['a', 'b']));
  });

  it('notifies subscribers of changed keys after remove resolves', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.set({a: 1});
    const listener = vi.fn();
    storage.subscribe(listener);

    await storage.remove(['a']);
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(['a']));
  });

  it('stops notifying after unsubscribe', async () => {
    const storage = new InMemoryKeyValueStorage();
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);
    unsubscribe();

    await storage.set({a: 1});
    // Flush microtasks; the listener must not have been (re-)registered.
    await Promise.resolve();
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });

  it('isolates a throwing listener from other listeners', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const storage = new InMemoryKeyValueStorage();
      const throwing = vi.fn(() => {
        throw new Error('boom');
      });
      const other = vi.fn();
      storage.subscribe(throwing);
      storage.subscribe(other);

      await storage.set({a: 1});
      await vi.waitFor(() => expect(other).toHaveBeenCalledWith(['a']));
      expect(throwing).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'InMemoryKeyValueStorage listener failed',
        expect.any(Error),
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  describe('failOnce', () => {
    it('rejects only the next call to the given op, leaving state untouched', async () => {
      const storage = new InMemoryKeyValueStorage();
      storage.failOnce('set');

      await expect(storage.set({a: 1})).rejects.toThrow('injected failure');
      expect(storage.itemCount()).toBe(0);

      // The second call succeeds; the failure was consumed once.
      await storage.set({a: 1});
      expect(await storage.get(['a'])).toEqual({a: 1});
    });

    it('queues multiple failures for the same op', async () => {
      const storage = new InMemoryKeyValueStorage();
      storage.failOnce('get');
      storage.failOnce('get');

      await expect(storage.get(['a'])).rejects.toThrow('injected failure');
      await expect(storage.get(['a'])).rejects.toThrow('injected failure');
      await expect(storage.get(['a'])).resolves.toEqual({});
    });

    it('only affects the requested op', async () => {
      const storage = new InMemoryKeyValueStorage();
      storage.failOnce('remove');

      await storage.set({a: 1});
      expect(await storage.get(['a'])).toEqual({a: 1});
      await expect(storage.remove(['a'])).rejects.toThrow('injected failure');
      expect(storage.itemCount()).toBe(1);
    });
  });

  describe('snapshot', () => {
    it('exposes the raw JSON representation of stored values', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({a: {x: 1}});
      expect(storage.snapshot()).toEqual({a: JSON.stringify({x: 1})});
    });
  });
});
