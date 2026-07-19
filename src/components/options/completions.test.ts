import {
  autocompletion,
  CompletionContext,
  currentCompletions,
  startCompletion,
} from '@codemirror/autocomplete';
import {javascript, javascriptLanguage} from '@codemirror/lang-javascript';
import {EditorState, EditorView, Transaction} from '@uiw/react-codemirror';

import {cocopyCompletionSource} from './completions';

function complete(code: string, position = code.length, explicit = true) {
  const state = EditorState.create({
    doc: code,
    extensions: [javascript()],
  });
  return cocopyCompletionSource(
    new CompletionContext(state, position, explicit),
  );
}

function labels(code: string, position = code.length, explicit = true) {
  return complete(code, position, explicit)?.options.map(
    option => option.label,
  );
}

test('completes properties on the function argument', () => {
  expect(labels('(input) => input.')).toEqual([
    'title',
    'url',
    'content',
    'selectingText',
    'modifier',
  ]);
});

test('completes modifier properties on the function argument', () => {
  expect(labels('(input) => input.modifier.')).toEqual([
    'alt',
    'ctrl',
    'meta',
    'shift',
  ]);
});

test('completes properties in the argument destructuring pattern', () => {
  const code = '({}) => {}';
  expect(labels(code, code.indexOf('}'))).toEqual([
    'title',
    'url',
    'content',
    'selectingText',
    'modifier',
  ]);
});

test('completes while typing a destructured property', () => {
  const code = '({ti}) => {}';
  expect(labels(code, code.indexOf('}'))).toContain('title');
});

test('completes an incomplete destructuring pattern', () => {
  expect(labels('({ti')).toContain('title');
});

test('completes an incomplete destructuring pattern implicitly', () => {
  expect(labels('({ti', undefined, false)).toContain('title');
});

test('completes destructured variables in the function body', () => {
  const code = '({title}) => {\n  ti\n}';
  expect(labels(code, code.indexOf('ti') + 2)).toContain('title');
});

test('completes modifier properties in nested destructuring', () => {
  const code = '({modifier: {}}) => {}';
  const position = code.indexOf('{}') + 1;
  expect(labels(code, position)).toEqual(['alt', 'ctrl', 'meta', 'shift']);
});

test('completes the sandbox helper at the root', () => {
  expect(labels('() => ren')).toEqual(['render']);
});

test('registers destructuring completions with the editor', async () => {
  const code = '({title}) => {\n  ti\n}';
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: code,
      selection: {anchor: code.indexOf('ti') + 2},
      extensions: [
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  startCompletion(view);
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(currentCompletions(view.state).map(option => option.label)).toContain(
    'title',
  );
  view.destroy();
});

test('activates destructuring completions while typing', async () => {
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: '({',
      selection: {anchor: 2},
      extensions: [
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  view.dispatch({
    changes: {from: 2, insert: 't'},
    selection: {anchor: 3},
    annotations: Transaction.userEvent.of('input.type'),
  });
  await new Promise(resolve => setTimeout(resolve, 150));

  expect(currentCompletions(view.state).map(option => option.label)).toContain(
    'title',
  );
  view.destroy();
});
