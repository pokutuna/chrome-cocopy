import {createContext, useContext, useEffect, useState} from 'react';

import {
  Config,
  ConfigStore,
  DEFAULT_CONFIG,
  getConfigStore,
} from '../../lib/config';

// Default is undefined (not getConfigStore()) so that importing this module
// never touches chrome.storage; tests wrap components in a provider carrying
// a store built on InMemoryKeyValueStorage.
const ConfigStoreContext = createContext<ConfigStore | undefined>(undefined);

export const ConfigStoreProvider = ConfigStoreContext.Provider;

export function useConfigStore(): ConfigStore {
  return useContext(ConfigStoreContext) ?? getConfigStore();
}

// Read once per page and shared by every consumer, so popup startup performs a
// single storage.sync read. undefined until that read resolves; consumers fall
// back to their defaults until it does.
const ConfigContext = createContext<Config | undefined>(undefined);

export function useConfig(): Config | undefined {
  return useContext(ConfigContext);
}

export function ConfigProvider(props: {children: React.ReactNode}) {
  const configStore = useConfigStore();
  const [config, setConfig] = useState<Config | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      configStore
        .read()
        .then(next => {
          if (!cancelled) setConfig(next);
        })
        .catch(() => {
          // Reads degrade to the defaults rather than failing the page.
          if (!cancelled) setConfig({...DEFAULT_CONFIG});
        });
    };
    load();
    // Reflects changes made from another context (e.g. the options window
    // while the popup is open), the same pattern as useSubscribeFunctions.
    const unsubscribe = configStore.subscribe(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configStore]);

  return (
    <ConfigContext.Provider value={config}>
      {props.children}
    </ConfigContext.Provider>
  );
}
