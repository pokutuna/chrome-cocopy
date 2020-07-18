import {CopyFunctionWithTheme} from './function';
import {PageTarget} from './target';

const simplifyAmazon = (target: PageTarget) => {
  const match = target.pageURL.match(/(\/dp\/\w+)[/?]?/);
  return match ? new URL(target.pageURL).origin + match[1] : target.pageURL;
};

const defaultRules: CopyFunctionWithTheme[] = [
  {
    id: 'default-1',
    name: 'Markdown: [title](url)',
    types: ['page'],
    code: ((target: PageTarget) =>
      `[${target.title}](${target.pageURL})`).toString(),
    glob: undefined,
    enabled: true,
    isBuiltIn: true,
    version: 1,
    theme: {
      icon: {
        char: 'M⬇',
      },
      textColor: '#000000',
      backgroundColor: '#f5f5f5',
    },
  },
  {
    id: 'default-2',
    name: 'Scrapbox: [title url]',
    types: ['page'],
    code: ((target: PageTarget) =>
      `[${target.title} ${target.pageURL}]`).toString(),
    glob: undefined,
    enabled: true,
    isBuiltIn: true,
    version: 1,
    theme: {
      icon: {
        char: 'S',
      },
      textColor: '#FFFFFF',
      backgroundColor: '#06B632',
    },
  },
  {
    id: 'default-3',
    name: 'Simplify Amazon.co.jp Item URL',
    types: ['page'],
    code: simplifyAmazon.toString(),
    glob: 'https://amazon.co.jp/*/db/*',
    enabled: true,
    isBuiltIn: true,
    version: 1,
    theme: {
      icon: {
        char: 'Ama',
      },
      textColor: '#000000',
      backgroundColor: '#ffa724',
    },
  },
];

export const getCopyFunctions = (): Promise<CopyFunctionWithTheme[]> => {
  return new Promise(resolve => {
    chrome.storage.sync.get({functions: defaultRules}, (value: any) => {
      Array.isArray(value.functions) ? resolve(value.functions) : resolve([]);
    });
  });
};

export const setCopyFunctions = (
  functions: CopyFunctionWithTheme[]
): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.sync.set({functions}, resolve);
  });
};
