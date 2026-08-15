import {createContext, useContext} from 'react';

import {Language, Messages, detectLanguage, en, ja} from '../../lib/i18n';
import {useConfig} from './ConfigContext';

const catalogs: Record<Language, Messages> = {en, ja};

// Default is undefined (not the English catalog) so useT applies the fallback
// itself: components stay renderable outside the provider — tests included —
// and always in English there (docs/i18n.md, "Distribution").
const I18nContext = createContext<Messages | undefined>(undefined);

export function useT(): Messages {
  return useContext(I18nContext) ?? en;
}

export function I18nProvider(props: {children: React.ReactNode}) {
  // The language derives from ConfigProvider's shared read; this provider
  // performs no storage access of its own, so i18n adds no read to popup
  // startup. While the read is in flight (config === undefined) the first
  // paint uses the browser language; an explicit stored setting replaces it
  // once the read resolves (docs/i18n.md, "起動時に言語が決まる").
  const config = useConfig();
  const language: Language =
    config === undefined || config.language === 'auto'
      ? detectLanguage()
      : config.language;

  return (
    <I18nContext.Provider value={catalogs[language]}>
      {props.children}
    </I18nContext.Provider>
  );
}
