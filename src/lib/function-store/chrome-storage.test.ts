import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ChromeKeyValueStorage} from './chrome-storage';

// Hand-written stub of the chrome.storage API surface this adapter touches.
// vitest.setup.ts installs a global `chrome` mock for component tests, but it
// only covers `storage.sync` with a single-arg `onChanged` shape; this
// adapter also uses `storage.local` and the two-arg
// `onChanged(changes, areaName)` signature, so we replace `global.chrome`
// with a purpose-built stub for the duration of this file.
type ChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: chrome.storage.AreaName,
) => void;

// Only the subset of chrome.storage.StorageArea this adapter actually calls
// is implemented; the rest of the interface is irrelevant to these tests.
function createStorageAreaStub() {
  const store = new Map<string, unknown>();
  const stub = {
    get: vi.fn(async (keys: string[] | null) => {
      if (keys === null) return Object.fromEntries(store);
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        if (store.has(key)) result[key] = store.get(key);
      }
      return result;
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(items)) store.set(key, value);
    }),
    remove: vi.fn(async (keys: string[]) => {
      for (const key of keys) store.delete(key);
    }),
    setAccessLevel: vi.fn(async () => {}),
  };
  return stub as typeof stub & chrome.storage.StorageArea;
}

function createChromeStub() {
  const listeners = new Set<ChangeListener>();
  return {
    storage: {
      sync: createStorageAreaStub(),
      local: createStorageAreaStub(),
      onChanged: {
        addListener: vi.fn((listener: ChangeListener) => {
          listeners.add(listener);
        }),
        removeListener: vi.fn((listener: ChangeListener) => {
          listeners.delete(listener);
        }),
      },
    },
    // Test helper, not part of the chrome API: fire a change event as chrome
    // would after a set/remove in `areaName`.
    __dispatchChange(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: chrome.storage.AreaName,
    ) {
      for (const listener of listeners) listener(changes, areaName);
    },
  };
}

let chromeStub: ReturnType<typeof createChromeStub>;
const originalChrome = global.chrome;

beforeEach(() => {
  chromeStub = createChromeStub();
  Object.assign(global, {chrome: chromeStub});
});

afterEach(() => {
  Object.assign(global, {chrome: originalChrome});
});

describe('ChromeKeyValueStorage', () => {
  it('normalizes get/set/remove to the Promise contract', async () => {
    const storage = new ChromeKeyValueStorage(chromeStub.storage.sync, 'sync');

    await storage.set({a: 1, b: 2});
    await expect(storage.get(['a', 'b'])).resolves.toEqual({a: 1, b: 2});
    await expect(storage.getAll()).resolves.toEqual({a: 1, b: 2});

    await storage.remove(['a']);
    await expect(storage.getAll()).resolves.toEqual({b: 2});
  });

  it('reads multiple keys in a single get call', async () => {
    const storage = new ChromeKeyValueStorage(chromeStub.storage.sync, 'sync');
    await storage.set({a: 1, b: 2, c: 3});

    await storage.get(['a', 'b', 'c']);
    expect(chromeStub.storage.sync.get).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('calls setAccessLevel(TRUSTED_CONTEXTS) exactly once before the first operation, for sync only', async () => {
    const storage = new ChromeKeyValueStorage(chromeStub.storage.sync, 'sync');

    await storage.set({a: 1});
    await storage.get(['a']);
    await storage.getAll();
    await storage.remove(['a']);

    expect(chromeStub.storage.sync.setAccessLevel).toHaveBeenCalledTimes(1);
    expect(chromeStub.storage.sync.setAccessLevel).toHaveBeenCalledWith({
      accessLevel: 'TRUSTED_CONTEXTS',
    });

    // It must have resolved before the first storage.set call fired.
    const setAccessOrder =
      chromeStub.storage.sync.setAccessLevel.mock.invocationCallOrder[0];
    const firstSetOrder =
      chromeStub.storage.sync.set.mock.invocationCallOrder[0];
    expect(setAccessOrder).toBeLessThan(firstSetOrder);
  });

  it('does not call setAccessLevel for the local area', async () => {
    const storage = new ChromeKeyValueStorage(
      chromeStub.storage.local,
      'local',
    );
    await storage.set({a: 1});
    expect(chromeStub.storage.local.setAccessLevel).not.toHaveBeenCalled();
  });

  it('continues without calling setAccessLevel when unavailable', async () => {
    const area = createStorageAreaStub();
    // Simulate a browser without setAccessLevel (e.g. Firefox).
    // @ts-expect-error deleting a required stub method to simulate absence
    delete area.setAccessLevel;

    const storage = new ChromeKeyValueStorage(area, 'sync');
    await expect(storage.set({a: 1})).resolves.toBeUndefined();
    await expect(storage.get(['a'])).resolves.toEqual({a: 1});
  });

  it('rejects when the underlying write errors', async () => {
    const storage = new ChromeKeyValueStorage(chromeStub.storage.sync, 'sync');
    chromeStub.storage.sync.set.mockRejectedValueOnce(
      new Error('QUOTA_BYTES exceeded'),
    );

    await expect(storage.set({a: 1})).rejects.toThrow('QUOTA_BYTES exceeded');
  });

  describe('subscribe', () => {
    it('normalizes onChanged into a changed-keys array, filtered by areaName', () => {
      const storage = new ChromeKeyValueStorage(
        chromeStub.storage.sync,
        'sync',
      );
      const listener = vi.fn();
      storage.subscribe(listener);

      chromeStub.__dispatchChange({a: {newValue: 1}, b: {newValue: 2}}, 'sync');
      expect(listener).toHaveBeenCalledWith(['a', 'b']);

      listener.mockClear();
      chromeStub.__dispatchChange({c: {newValue: 3}}, 'local');
      expect(listener).not.toHaveBeenCalled();
    });

    it('stops notifying after unsubscribe, via removeListener', () => {
      const storage = new ChromeKeyValueStorage(
        chromeStub.storage.sync,
        'sync',
      );
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      unsubscribe();

      expect(chromeStub.storage.onChanged.removeListener).toHaveBeenCalled();
      chromeStub.__dispatchChange({a: {newValue: 1}}, 'sync');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
