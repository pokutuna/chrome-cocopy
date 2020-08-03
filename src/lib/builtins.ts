import {CopyFunctionWithTheme} from './function';

const copyAsMarkdownFn = `
/**
 * Copy link as Markdown.
 */
({title, pageURL}) => {
  const escaped = title.replace(/[\\[\\]]/g, '\\\\$&');
  return \`[\${escaped}](\${pageURL})\`;
};
`.trim();

export const copyAsMarkdown: CopyFunctionWithTheme = {
  id: 'builtin-markdown',
  name: 'Markdown: [title](url)',
  types: ['page'],
  code: copyAsMarkdownFn,
  pattern: undefined,
  version: 1,
  theme: {
    symbol: 'M⬇',
    textColor: '#000000',
    backgroundColor: '#f5f5f5',
  },
};

const copyAsHTMLFn = `
/**
 * Copy as anchor element.
 *
 * You can use mustache template with \`render\` function.
 * @see https://github.com/janl/mustache.js
 */
target => render('<a href="{{&pageURL}}">{{title}}</a>', target);`.trim();

export const copyAsHTML: CopyFunctionWithTheme = {
  id: 'builtin-html',
  name: 'HTML: <a href={url}>{title}</a>',
  types: ['page'],
  code: copyAsHTMLFn,
  pattern: undefined,
  version: 1,
  theme: {
    symbol: 'H',
    textColor: '#FFFFFF',
    backgroundColor: '#ff5722',
  },
};

export const copyAsScrapboxFn =
  '({title, pageURL}) => `[${title} ${pageURL}]`;';

const copyAsScrapbox: CopyFunctionWithTheme = {
  id: 'builtin-scrapbox',
  name: 'Scrapbox: [title url]',
  types: ['page'],
  code: copyAsScrapboxFn,
  pattern: undefined,
  version: 1,
  theme: {
    symbol: 'S',
    textColor: '#FFFFFF',
    backgroundColor: '#06B632',
  },
};

const simplifyAmazonFn = `
/**
 * Copy simplified amazon.co.jp item URL.
 *
 * Returning falsy value doesn't overwrite your clipboard.
 */
({pageURL}) => {
  const match = pageURL.match(/(\\/dp\\/\\w+)[/?]?/);
  return match ? new URL(pageURL).origin + match[1] : undefined;
}
`.trim();

export const copyAsSimplifiedAmazonURL: CopyFunctionWithTheme = {
  id: 'builtin-amazon',
  name: 'amazon.co.jp: URL Simplify',
  types: ['page'],
  code: simplifyAmazonFn,
  pattern: '^https://www\\.amazon\\.co\\.jp/.+/dp/.+$',
  version: 1,
  theme: {
    symbol: '🌴',
    textColor: '#000000',
    backgroundColor: '#ffa724',
  },
};

const youtubeVideoWithViews = `
/**
 * Copy YouTube video title, views, likes and simple URL.
 *
 * You can access the page HTML with \`content\` property.
 * And using \`DOMParser\` makes you query like a document object.
 */
({pageURL, content}) => {
  const url = new URL(pageURL);
  const id = new URLSearchParams(url.search).get('v');
  const simple = \`\${url.origin}/watch?v=\${id}\`;

  const doc = new DOMParser().parseFromString(content, 'text/html');
  const title = doc.querySelector('h1').textContent;
  const views = doc.querySelector('#info-text .view-count').textContent;
  const likes = doc.querySelector('#menu #text').getAttribute('aria-label');
  return [title, views, likes, simple].join(' ');
};
`.trim();

const youtubeInfo: CopyFunctionWithTheme = {
  id: 'builtin-youtube',
  name: 'YouTube: title, views, likes, url',
  types: ['page'],
  code: youtubeVideoWithViews,
  pattern: '^https://www.youtube.com/.+[?&]v=.+',
  version: 1,
  theme: {
    symbol: '📺',
    textColor: '#FFFFFF',
    backgroundColor: '#FF0000',
  },
};

export const defaultFunctions: CopyFunctionWithTheme[] = [
  copyAsMarkdown,
  copyAsHTML,
  copyAsScrapbox,
  copyAsSimplifiedAmazonURL,
  youtubeInfo,
];
