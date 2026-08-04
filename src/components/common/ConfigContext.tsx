import {createContext, useContext} from 'react';

import {ConfigStore, getConfigStore} from '../../lib/config';

// Default is undefined (not getConfigStore()) so that importing this module
// never touches chrome.storage; tests wrap components in a provider carrying
// a store built on InMemoryKeyValueStorage.
const ConfigStoreContext = createContext<ConfigStore | undefined>(undefined);

export const ConfigStoreProvider = ConfigStoreContext.Provider;

export function useConfigStore(): ConfigStore {
  return useContext(ConfigStoreContext) ?? getConfigStore();
}
