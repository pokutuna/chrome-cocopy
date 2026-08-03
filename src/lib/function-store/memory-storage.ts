import {KeyValueStorage, Unsubscribe} from './storage';

type Op = 'get' | 'getAll' | 'set' | 'remove';

/**
 * In-memory `KeyValueStorage` fake for repository unit tests
 * (docs/function-storage.md#Repository-Unit-Tests).
 *
 * Values are stored as JSON strings, matching chrome.storage's own
 * serialization: setting an `undefined` property drops it, and reads never
 * return a reference shared with what was written.
 */
export class InMemoryKeyValueStorage implements KeyValueStorage {
  private readonly items = new Map<string, string>();
  private readonly listeners = new Set<(changedKeys: string[]) => void>();
  private readonly failures: Record<Op, Error[]> = {
    get: [],
    getAll: [],
    set: [],
    remove: [],
  };

  private consumeFailure(op: Op): Error | undefined {
    return this.failures[op].shift();
  }

  /** Makes the next call to `op` reject once. Can be queued multiple times. */
  failOnce(op: Op, error: Error = new Error(`injected failure: ${op}`)): void {
    this.failures[op].push(error);
  }

  async get(keys: string[]): Promise<Record<string, unknown>> {
    const failure = this.consumeFailure('get');
    if (failure) throw failure;

    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const raw = this.items.get(key);
      if (raw !== undefined) result[key] = JSON.parse(raw);
    }
    return result;
  }

  async getAll(): Promise<Record<string, unknown>> {
    const failure = this.consumeFailure('getAll');
    if (failure) throw failure;

    const result: Record<string, unknown> = {};
    for (const [key, raw] of this.items) {
      result[key] = JSON.parse(raw);
    }
    return result;
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const failure = this.consumeFailure('set');
    if (failure) throw failure;

    // Serialize every value before mutating state, so a value that can't be
    // JSON-encoded (e.g. a bare `undefined` or a function) rejects the whole
    // call without partially applying it.
    const entries = Object.entries(items).map(([key, value]) => {
      const raw = JSON.stringify(value);
      if (raw === undefined) {
        throw new Error(`value for key "${key}" is not JSON-serializable`);
      }
      return [key, raw] as const;
    });

    for (const [key, raw] of entries) {
      this.items.set(key, raw);
    }

    this.notify(Object.keys(items));
  }

  async remove(keys: string[]): Promise<void> {
    const failure = this.consumeFailure('remove');
    if (failure) throw failure;

    for (const key of keys) {
      this.items.delete(key);
    }

    this.notify(keys);
  }

  subscribe(listener: (changedKeys: string[]) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(changedKeys: string[]): void {
    if (changedKeys.length === 0) return;
    queueMicrotask(() => {
      for (const listener of this.listeners) {
        // Isolate listener failures from each other; a throwing listener
        // must not stop other listeners from being notified.
        try {
          listener(changedKeys);
        } catch (error) {
          console.error('InMemoryKeyValueStorage listener failed', error);
        }
      }
    });
  }

  /** Test helper: raw JSON snapshot of everything currently stored. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.items);
  }

  /** Test helper: number of items currently stored. */
  itemCount(): number {
    return this.items.size;
  }
}
