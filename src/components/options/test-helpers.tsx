import React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createConfigStore} from '../../lib/config';
import {CopyFunction} from '../../lib/function';
import {FunctionStore} from '../../lib/function-store';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {createLegacyBackupRepository} from '../../lib/function-store/migration';
import {createFunctionRepository} from '../../lib/function-store/repository';
import {seedSnapshot} from '../../lib/function-store/repository.test-helpers';
import {ConfigStoreProvider} from '../common/ConfigContext';
import {FunctionStoreProvider} from '../common/FunctionStoreContext';

export interface TestStore extends FunctionStore {
  sync: InMemoryKeyValueStorage;
  local: InMemoryKeyValueStorage;
}

/**
 * A FunctionStore backed by in-memory storage, so options tests exercise the
 * real repository (commit protocol included) without chrome.storage.
 */
export function createTestStore(): TestStore {
  const sync = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  return {
    sync,
    local,
    repository: createFunctionRepository({storage: sync, cache: local}),
    legacyBackup: createLegacyBackupRepository({sync, local}),
  };
}

/** Seeds a committed snapshot the repository can read straight away. */
export async function seedStore(
  store: TestStore,
  functions: CopyFunction[],
): Promise<void> {
  await seedSnapshot(store.sync, functions);
}

export function renderWithStore(
  store: FunctionStore,
  ui: React.ReactNode,
  initialEntries: string[] = ['/'],
): React.ReactElement {
  // A dedicated in-memory ConfigStore keeps Settings (rendered by App/PageRoot)
  // from falling back to getConfigStore() and touching real chrome.storage.
  const configStore = createConfigStore(new InMemoryKeyValueStorage());
  return (
    <FunctionStoreProvider value={store}>
      <ConfigStoreProvider value={configStore}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </ConfigStoreProvider>
    </FunctionStoreProvider>
  );
}
