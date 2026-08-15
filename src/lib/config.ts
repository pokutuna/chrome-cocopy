// Extension-wide user settings. Stored under its own storage.sync key,
// separate from FunctionStore: its catalog is immutable copy-on-write, so
// sharing a key would rewrite the catalog on every settings change.

import * as v from 'valibot';

import {ChromeKeyValueStorage} from './function-store/chrome-storage';
import {KeyValueStorage, Unsubscribe} from './function-store/storage';
// Type-only: the message catalogs must not enter this module's runtime graph.
import type {LanguageSetting} from './i18n';

export const CONFIG_KEY = 'cocopy:config';

export interface Config {
  closeAfterCopy: boolean;
  language: LanguageSetting;
}

export const DEFAULT_CONFIG: Config = {
  closeAfterCopy: false,
  language: 'auto',
};

// Forward-compatibility matters here, unlike FunctionStore: a config field
// added by a newer extension version must not make an older version's read()
// throw. Each field falls back to its own default independently, so one
// corrupt field never invalidates the rest of the object.
const configSchema = v.object({
  closeAfterCopy: v.fallback(
    v.optional(v.boolean(), DEFAULT_CONFIG.closeAfterCopy),
    DEFAULT_CONFIG.closeAfterCopy,
  ),
  language: v.fallback(
    v.optional(v.picklist(['en', 'ja', 'auto']), DEFAULT_CONFIG.language),
    DEFAULT_CONFIG.language,
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
  return {closeAfterCopy: parsed.closeAfterCopy, language: parsed.language};
}

export function createConfigStore(storage: KeyValueStorage): ConfigStore {
  async function writeMerged(patch: Partial<Config>): Promise<void> {
    const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
    const base =
      typeof raw === 'object' && raw !== null
        ? (raw as Record<string, unknown>)
        : DEFAULT_CONFIG;
    await storage.set({[CONFIG_KEY]: {...base, ...patch}});
  }

  // Tail of the update chain. storage.sync offers no atomic read-modify-write,
  // so two updates started before either settles would both read the same
  // stored value and the later write would drop the earlier change (changing
  // two settings in quick succession). Each update waits for the previous one
  // to settle before it reads.
  let pending: Promise<unknown> = Promise.resolve();

  return {
    async read(): Promise<Config> {
      const raw = (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
      if (raw === undefined) return {...DEFAULT_CONFIG};
      return parseConfig(raw);
    },

    update(patch: Partial<Config>): Promise<void> {
      // Settled either way: a failed update must not stop the queue, and its
      // rejection still reaches this caller through `run`.
      const run = pending.then(
        () => writeMerged(patch),
        () => writeMerged(patch),
      );
      pending = run.catch(() => {});
      return run;
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
