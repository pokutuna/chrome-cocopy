// Extension-wide user settings. Stored under its own storage.sync key,
// separate from FunctionStore: its catalog is immutable copy-on-write, so
// sharing a key would rewrite the catalog on every settings change.

import * as v from 'valibot';

import {ChromeKeyValueStorage} from './function-store/chrome-storage';
import {KeyValueStorage, Unsubscribe} from './function-store/storage';

export const CONFIG_KEY = 'cocopy:config';

export interface Config {
  closeAfterCopy: boolean;
}

export const DEFAULT_CONFIG: Config = {closeAfterCopy: false};

// Forward-compatibility matters here, unlike FunctionStore: a config field
// added by a newer extension version must not make an older version's read()
// throw. Each field falls back to its own default independently, so one
// corrupt field never invalidates the rest of the object.
const configSchema = v.object({
  closeAfterCopy: v.fallback(
    v.optional(v.boolean(), DEFAULT_CONFIG.closeAfterCopy),
    DEFAULT_CONFIG.closeAfterCopy,
  ),
});

export interface ConfigStore {
  read(): Promise<Config>;
  /**
   * Read-modify-write. Merges `patch` onto the raw stored value (not the
   * parsed Config), so unknown fields written by a newer extension version
   * survive an update from an older one.
   */
  update(patch: Partial<Config>): Promise<void>;
  subscribe(listener: () => void): Unsubscribe;
}

function parseConfig(raw: unknown): Config {
  if (typeof raw !== 'object' || raw === null) return {...DEFAULT_CONFIG};
  const parsed = v.parse(configSchema, raw);
  return {closeAfterCopy: parsed.closeAfterCopy};
}

export function createConfigStore(storage: KeyValueStorage): ConfigStore {
  return {
    async read(): Promise<Config> {
      const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
      if (raw === undefined) return {...DEFAULT_CONFIG};
      return parseConfig(raw);
    },

    async update(patch: Partial<Config>): Promise<void> {
      const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
      const base =
        typeof raw === 'object' && raw !== null
          ? (raw as Record<string, unknown>)
          : DEFAULT_CONFIG;
      await storage.set({[CONFIG_KEY]: {...base, ...patch}});
    },

    subscribe(listener: () => void): Unsubscribe {
      return storage.subscribe(changedKeys => {
        if (changedKeys.includes(CONFIG_KEY)) listener();
      });
    },
  };
}

let instance: ConfigStore | undefined;

/**
 * Returns the ConfigStore backed by chrome.storage.sync. Lazily constructed
 * so that importing this module has no side effects (tests inject their own
 * store instead of calling this).
 */
export function getConfigStore(): ConfigStore {
  if (!instance) {
    instance = createConfigStore(
      new ChromeKeyValueStorage(chrome.storage.sync, 'sync'),
    );
  }
  return instance;
}
