import type {Language} from './index';

// The only browser API used by src/lib/i18n/, and a Web standard rather than
// a WebExtensions API (docs/i18n.md, "Language Resolution").
export function detectLanguage(): Language {
  return navigator.language.startsWith('ja') ? 'ja' : 'en';
}
