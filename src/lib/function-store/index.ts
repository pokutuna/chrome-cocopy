// Wires the FunctionStore layers to the real browser storage
// (docs/function-storage.md, "Architecture" / "Migration Trigger").
//
// popup and options never see the Active Pointer or the legacy format: they
// obtain a FunctionRepository here, and migration runs inside the repository's
// onMissingActivePointer hook on first use.

import {ChromeKeyValueStorage} from './chrome-storage';
import {
  createLegacyBackupRepository,
  createMigrationCoordinator,
  LegacyBackupRepository,
} from './migration';
import {createFunctionRepository, FunctionRepository} from './repository';

export interface FunctionStore {
  repository: FunctionRepository;
  legacyBackup: LegacyBackupRepository;
}

let instance: FunctionStore | undefined;

/**
 * Returns the FunctionStore backed by chrome.storage. Lazily constructed so
 * that importing this module has no side effects (tests inject their own
 * store instead of calling this).
 */
export function getFunctionStore(): FunctionStore {
  if (!instance) {
    const sync = new ChromeKeyValueStorage(chrome.storage.sync, 'sync');
    const local = new ChromeKeyValueStorage(chrome.storage.local, 'local');
    const coordinator = createMigrationCoordinator({sync, local});
    instance = {
      repository: createFunctionRepository({
        storage: sync,
        cache: local,
        onMissingActivePointer: () => coordinator.migrate(),
      }),
      legacyBackup: createLegacyBackupRepository({sync, local}),
    };
  }
  return instance;
}
