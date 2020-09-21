import {CopyFunction} from './function';

export const initialCode = `
/**
 * Return value will be copied to clipboard.
 * @param {Object} target
 * @returns {(string|undefined|Promise)}
 */
({title, pageURL, content}) => {
  return [title, pageURL].join(' ');
}
`.trim();

const copyAsMarkdownFn = `
/**
 * Copy link as Markdown.
 */
({title, pageURL}) => {
  const escaped = title.replace(/[\\[\\]]/g, '\\\\$&');
  return \`[\${escaped}](\${pageURL})\`;
};
`.trim();

export const copyAsMarkdown: CopyFunction = {
  id: 'builtin-markdown',
  name: 'Markdown: [title](url)',
  types: ['page'],
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
target => render('<a href="{{&pageURL}}">{{title}}</a>', target);`.trim();

export const copyAsHTML: CopyFunction = {
  id: 'builtin-html',
  name: 'HTML: <a href={url}>{title}</a>',
  types: ['page'],
  code: copyAsHTMLFn,
  pattern: undefined,
  version: 1,
  theme: {
    textColor: '#FFFFFF',
    backgroundColor: '#ff5722',
  },
};

export const defaultFunctions: CopyFunction[] = [copyAsMarkdown, copyAsHTML];
