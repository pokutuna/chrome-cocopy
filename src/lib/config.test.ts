import {describe, expect, it, vi} from 'vitest';

import {CONFIG_KEY, createConfigStore, DEFAULT_CONFIG} from './config';
import {InMemoryKeyValueStorage} from './function-store/memory-storage';

describe('createConfigStore', () => {
  describe('read', () => {
    it('returns DEFAULT_CONFIG when the key does not exist', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      expect(await store.read()).toEqual(DEFAULT_CONFIG);
    });

    it('reads a normal stored value', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: {closeAfterCopy: true, language: 'ja'}});
      const store = createConfigStore(storage);
      expect(await store.read()).toEqual({
        closeAfterCopy: true,
        language: 'ja',
      });
    });

    it('parses a value containing unknown fields, still reading closeAfterCopy', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({
        [CONFIG_KEY]: {
          closeAfterCopy: true,
          futureField: 'from a newer version',
        },
      });
      const store = createConfigStore(storage);
      expect(await store.read()).toEqual({
        closeAfterCopy: true,
        language: 'auto',
      });
    });

    it('falls back to the default when the stored value is not an object', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: 'not an object'});
      const store = createConfigStore(storage);
      expect(await store.read()).toEqual(DEFAULT_CONFIG);
    });

    it('falls back closeAfterCopy to its default when the field is not a boolean', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: {closeAfterCopy: 'yes'}});
      const store = createConfigStore(storage);
      expect(await store.read()).toEqual(DEFAULT_CONFIG);
    });

    it('defaults language to auto when the field is missing', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: {closeAfterCopy: true}});
      const store = createConfigStore(storage);
      expect((await store.read()).language).toBe('auto');
    });

    it('falls back language to auto on an unknown value', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: {language: 'fr'}});
      const store = createConfigStore(storage);
      expect((await store.read()).language).toBe('auto');
    });

    it('falls back language to auto on a wrong type', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({[CONFIG_KEY]: {language: 42}});
      const store = createConfigStore(storage);
      expect((await store.read()).language).toBe('auto');
    });
  });

  describe('update', () => {
    it('writes a value readable back through read()', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      await store.update({closeAfterCopy: true});
      expect(await store.read()).toEqual({
        closeAfterCopy: true,
        language: 'auto',
      });
    });

    it('preserves unknown existing fields in the raw stored value', async () => {
      const storage = new InMemoryKeyValueStorage();
      await storage.set({
        [CONFIG_KEY]: {closeAfterCopy: false, futureField: 'keep me'},
      });
      const store = createConfigStore(storage);
      await store.update({closeAfterCopy: true});

      const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
      expect(raw).toEqual({closeAfterCopy: true, futureField: 'keep me'});
    });

    it('writes successfully when the key does not exist yet', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      await store.update({closeAfterCopy: true});

      const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
      expect(raw).toEqual({closeAfterCopy: true, language: 'auto'});
    });

    it('keeps both changes when two updates overlap', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);

      // Two settings changed before either write settles: without
      // serialization both reads see the same stored value and the later
      // write drops the earlier change.
      await Promise.all([
        store.update({closeAfterCopy: true}),
        store.update({language: 'ja'}),
      ]);

      expect(await store.read()).toEqual({
        closeAfterCopy: true,
        language: 'ja',
      });
    });

    it('applies a queued update after an earlier one fails', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      storage.failOnce('set');

      const failing = store.update({closeAfterCopy: true});
      const following = store.update({language: 'ja'});

      await expect(failing).rejects.toThrow('injected failure: set');
      await expect(following).resolves.toBeUndefined();
      expect((await store.read()).language).toBe('ja');
    });
  });

  describe('subscribe', () => {
    it('notifies the listener when CONFIG_KEY changes', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.update({closeAfterCopy: true});
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    });

    it('does not notify the listener when another key changes', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      const listener = vi.fn();
      store.subscribe(listener);

      await storage.set({'some:other:key': 1});
      // Flush microtasks; the listener must not have fired for an unrelated key.
      await Promise.resolve();
      await Promise.resolve();
      expect(listener).not.toHaveBeenCalled();
    });

    it('stops notifying after unsubscribe', async () => {
      const storage = new InMemoryKeyValueStorage();
      const store = createConfigStore(storage);
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      await store.update({closeAfterCopy: true});
      await Promise.resolve();
      await Promise.resolve();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
