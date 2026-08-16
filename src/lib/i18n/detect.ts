import type {Language} from './index';

export function detectLanguage(): Language {
  return navigator.language.startsWith('ja') ? 'ja' : 'en';
}
