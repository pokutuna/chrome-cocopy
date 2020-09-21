import {CopyFunction} from './function';

export const initialCode = `
/**
 * Return value will be copied to clipboard.
 * @param {Object} page
 * @returns {(string|undefined|Promise)}
 */
({title, url, content, selectingText}) => {
  return [title, url].join(' ');
}
`.trim();

const copyAsMarkdownFn = `
/**
 * Copy link as Markdown.
 */
({title, url}) => {
  const escaped = title.replace(/[\\[\\]]/g, '\\\\$&');
  return \`[\${escaped}](\${url})\`;
};
`.trim();

export const copyAsMarkdown: CopyFunction = {
  id: 'builtin-markdown',
  name: 'Markdown: [title](url)',
  code: copyAsMarkdownFn,
  pattern: undefined,
  version: 1,
  theme: {
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
page => render('<a href="{{&url}}">{{title}}</a>', page);`.trim();

export const copyAsHTML: CopyFunction = {
  id: 'builtin-html',
  name: 'HTML: <a href={url}>{title}</a>',
  code: copyAsHTMLFn,
  pattern: undefined,
  version: 1,
  theme: {
    textColor: '#FFFFFF',
    backgroundColor: '#ff5722',
  },
};

export const defaultFunctions: CopyFunction[] = [copyAsMarkdown, copyAsHTML];
