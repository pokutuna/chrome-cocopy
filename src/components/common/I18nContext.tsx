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
  // Until the stored config arrives the browser language is used, so the first
  // paint never waits on storage (docs/i18n.md, "起動時に言語が決まる").
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
