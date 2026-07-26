import {KeyValueStorage, Unsubscribe} from './storage';

type AreaName = 'sync' | 'local';

/**
 * `KeyValueStorage` adapter over a Chrome `chrome.storage.StorageArea`
 * (docs/function-storage.md#Storage-Port).
 */
export class ChromeKeyValueStorage implements KeyValueStorage {
  private readonly area: chrome.storage.StorageArea;
  private readonly areaName: AreaName;

  // User-defined functions are not needed by content scripts. Restrict sync
  // storage to extension-owned contexts before the first operation
  // (docs/function-storage.md#content-script から関数コードが読まれる), mirroring
  // src/lib/config.ts. All operations serialize after this resolves; browsers
  // without setAccessLevel (Firefox, Safari) skip it and continue.
  private readonly accessReady: Promise<void>;

  constructor(area: chrome.storage.StorageArea, areaName: AreaName) {
    this.area = area;
    this.areaName = areaName;
    // A rejected setAccessLevel must not brick every subsequent operation;
    // treat it the same as the API being unavailable and continue.
    this.accessReady =
      areaName === 'sync' && typeof area.setAccessLevel === 'function'
        ? area
            .setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'})
            .catch(error => {
              console.warn('cocopy: setAccessLevel failed, continuing', error);
            })
        : Promise.resolve();
  }

  async get(keys: string[]): Promise<Record<string, unknown>> {
    await this.accessReady;
    return this.area.get(keys);
  }

  async getAll(): Promise<Record<string, unknown>> {
    await this.accessReady;
    return this.area.get(null);
  }

  async set(items: Record<string, unknown>): Promise<void> {
    await this.accessReady;
    await this.area.set(items);
  }

  async remove(keys: string[]): Promise<void> {
    await this.accessReady;
    await this.area.remove(keys);
  }

  subscribe(listener: (changedKeys: string[]) => void): Unsubscribe {
    const onChanged = (
      changes: {[key: string]: chrome.storage.StorageChange},
      areaName: chrome.storage.AreaName,
    ) => {
      if (areaName !== this.areaName) return;
      listener(Object.keys(changes));
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }
}
