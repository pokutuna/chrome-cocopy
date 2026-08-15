// Language selection types and the public i18n API. Everything under
// src/lib/i18n/ is pure TypeScript: no WebExtensions APIs (docs/i18n.md).

import {en} from './messages.en';

export type Language = 'en' | 'ja';
export type LanguageSetting = Language | 'auto';

export type {Messages} from './messages.en';
export {detectLanguage} from './detect';
export {ja} from './messages.ja';
export {en};
