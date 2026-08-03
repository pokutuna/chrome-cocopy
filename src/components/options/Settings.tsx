import {useCallback, useEffect, useState} from 'react';

import {DEFAULT_CONFIG} from '../../lib/config';
import {useConfigStore} from '../common/ConfigContext';
import {Section} from './Parts';

import styles from './Settings.module.css';

export function Settings() {
  const configStore = useConfigStore();
  const [closeAfterCopy, setCloseAfterCopy] = useState(
    DEFAULT_CONFIG.closeAfterCopy,
  );

  const load = useCallback(() => {
    configStore
      .read()
      .then(config => setCloseAfterCopy(config.closeAfterCopy))
      .catch(() => {
        // Settings degrade to the default rather than failing the page.
      });
  }, [configStore]);

  useEffect(() => {
    load();
    // Reflects changes made from another context (e.g. another options
    // window), the same pattern as useSubscribeFunctions (Subscribe.ts).
    return configStore.subscribe(load);
  }, [configStore, load]);

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setCloseAfterCopy(checked);
      configStore.update({closeAfterCopy: checked}).catch(() => {
        // Best-effort; the next subscribe/load cycle reconciles state.
      });
    },
    [configStore],
  );

  return (
    <Section title="Settings">
      <label className={styles.checkboxLabel} htmlFor="closeAfterCopy">
        <input
          type="checkbox"
          id="closeAfterCopy"
          checked={closeAfterCopy}
          onChange={onChange}
        />
        Close the popup after copying
      </label>
    </Section>
  );
}
