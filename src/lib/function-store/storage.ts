// Storage Port (docs/function-storage.md#Storage-Port).
//
// FunctionRepository depends only on this contract; browser differences are
// confined to adapters that implement it (ChromeKeyValueStorage,
// InMemoryKeyValueStorage for tests, and future Firefox/Safari adapters).
// Values are `unknown` here because schema validation is the repository's
// responsibility, not the storage layer's.

export type Unsubscribe = () => void;

export interface KeyValueStorage {
  /** Reads the given keys. Keys absent from storage are omitted from the result. */
  get(keys: string[]): Promise<Record<string, unknown>>;
  /** Reads every key currently in storage. */
  getAll(): Promise<Record<string, unknown>>;
  /** Writes multiple items in a single call; keys not present in `items` are left untouched. */
  set(items: Record<string, unknown>): Promise<void>;
  /** Removes the given keys. */
  remove(keys: string[]): Promise<void>;
  /**
   * Subscribes to change notifications. `listener` receives the keys that
   * changed; callers must re-read storage rather than trust the notification
   * as a diff (see docs/function-storage.md#Storage-Port).
   */
  subscribe(listener: (changedKeys: string[]) => void): Unsubscribe;
}
