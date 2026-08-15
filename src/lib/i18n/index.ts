import {en} from './messages.en';

export type Language = 'en' | 'ja';
export type LanguageSetting = Language | 'auto';

export type {Messages} from './messages.en';
export {detectLanguage} from './detect';
export {ja} from './messages.ja';
export {en};
