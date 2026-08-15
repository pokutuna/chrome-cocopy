import {useCallback, useEffect, useState} from 'react';

import {DEFAULT_CONFIG} from '../../lib/config';
import {LanguageSetting} from '../../lib/i18n';
import {useConfigStore} from '../common/ConfigContext';
import {useT} from '../common/I18nContext';
import {Section} from './Parts';

import styles from './Settings.module.css';

export function Settings() {
  const t = useT();
  const configStore = useConfigStore();
  const [closeAfterCopy, setCloseAfterCopy] = useState(
    DEFAULT_CONFIG.closeAfterCopy,
  );
  const [language, setLanguage] = useState<LanguageSetting>(
    DEFAULT_CONFIG.language,
  );

  const load = useCallback(() => {
    configStore
      .read()
      .then(config => {
        setCloseAfterCopy(config.closeAfterCopy);
        setLanguage(config.language);
      })
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

  const onChangeCloseAfterCopy = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setCloseAfterCopy(checked);
      configStore.update({closeAfterCopy: checked}).catch(() => {
        // Best-effort; the next subscribe/load cycle reconciles state.
      });
    },
    [configStore],
  );

  const onChangeLanguage = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      // The value set is closed: only the <option>s below produce it.
      const value = event.currentTarget.value as LanguageSetting;
      setLanguage(value);
      configStore.update({language: value}).catch(() => {
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
          onChange={onChangeCloseAfterCopy}
        />
        {t.settings.closeAfterCopy}
      </label>
      <label className={styles.selectLabel} htmlFor="language">
        {t.settings.language}
        {/* Language names are endonyms on purpose: each option must be
            readable in that language, so they are not catalog entries. */}
        <select id="language" value={language} onChange={onChangeLanguage}>
          <option value="auto">{t.settings.languageAuto}</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </label>
    </Section>
  );
}
