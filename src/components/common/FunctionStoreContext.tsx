import {createContext, useContext} from 'react';

import {FunctionStore, getFunctionStore} from '../../lib/function-store';
import {LegacyBackupRepository} from '../../lib/function-store/migration';
import {FunctionRepository} from '../../lib/function-store/repository';

// Default is undefined (not getFunctionStore()) so that importing this module
// never touches chrome.storage; tests wrap components in a provider carrying
// a store built on InMemoryKeyValueStorage.
const FunctionStoreContext = createContext<FunctionStore | undefined>(
  undefined,
);

export const FunctionStoreProvider = FunctionStoreContext.Provider;

export function useFunctionStore(): FunctionStore {
  return useContext(FunctionStoreContext) ?? getFunctionStore();
}

export function useFunctionRepository(): FunctionRepository {
  return useFunctionStore().repository;
}

export function useLegacyBackupRepository(): LegacyBackupRepository {
  return useFunctionStore().legacyBackup;
}
