import {CopyFunctionWithTheme, CopyFn} from './function';
import {PageTarget} from './target';

export const copyAsMarkdownFn: CopyFn = (target: PageTarget) =>
  `[${target.title}](${target.pageURL})`;

const copyAsMarkdown: CopyFunctionWithTheme = {
  id: 'builtin-markdown',
  name: 'Markdown: [title](url)',
  types: ['page'],
  code: copyAsMarkdownFn.toString(),
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
};

export const copyAsScrapboxFn: CopyFn = (target: PageTarget) =>
  `[${target.title} ${target.pageURL}]`;

const copyAsScrapbox: CopyFunctionWithTheme = {
  id: 'builtin-scrapbox',
  name: 'Scrapbox: [title url]',
  types: ['page'],
  code: copyAsScrapboxFn.toString(),
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
};

export const copyAsAnchorHTMLElementFn = (target: PageTarget) => `
  <a href="${encodeURI(target.pageURL)}">${target.title}</a>`;

const copyAsHTML: CopyFunctionWithTheme = {
  id: 'builtin-html',
  name: 'HTML: <a href={url}>{title}</a>',
  types: ['page'],
  code: copyAsAnchorHTMLElementFn.toString(),
  glob: undefined,
  enabled: true,
  isBuiltIn: true,
  version: 1,
  theme: {
    icon: {
      char: 'H',
    },
    textColor: '#FFFFFF',
    backgroundColor: '#ff5722',
  },
};

const simplifyAmazonFn: CopyFn = (target: PageTarget) => {
  const match = target.pageURL.match(/(\/dp\/\w+)[/?]?/);
  return match ? new URL(target.pageURL).origin + match[1] : undefined;
};

const copyAsSimplifiedAmazonURL: CopyFunctionWithTheme = {
  id: 'builtin-amazon',
  name: 'Simplify Amazon.co.jp Item URL',
  types: ['page'],
  code: simplifyAmazonFn.toString(),
  glob: 'https://amazon.co.jp/*/db/*',
  enabled: true,
  isBuiltIn: true,
  version: 1,
  theme: {
    icon: {
      char: '🌴',
    },
    textColor: '#000000',
    backgroundColor: '#ffa724',
  },
};

// export const debugFn: CopyFn = (target: PageTarget) => console.log(m as any);

const debug: CopyFunctionWithTheme = {
  id: 'builtin-debug',
  name: 'debugging',
  types: ['page'],
  code: '() => temp',
  glob: undefined,
  enabled: true,
  isBuiltIn: true,
  version: 1,
  theme: {
    icon: {
      char: '🐜',
    },
    textColor: '#000000',
    backgroundColor: '#f5f5f5',
  },
};

export const defaultFunctions: CopyFunctionWithTheme[] = [
  copyAsMarkdown,
  copyAsScrapbox,
  copyAsHTML,
  copyAsSimplifiedAmazonURL,
  debug,
];
