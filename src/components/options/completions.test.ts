import {
  autocompletion,
  CompletionContext,
  currentCompletions,
  startCompletion,
} from '@codemirror/autocomplete';
import {javascript, javascriptLanguage} from '@codemirror/lang-javascript';
import {EditorState, EditorView, Transaction} from '@uiw/react-codemirror';

import {
  cocopyCompletionSource,
  javascriptCompletionSource,
} from './completions';

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

function javascriptLabels(
  code: string,
  position = code.length,
  explicit = true,
) {
  const state = EditorState.create({
    doc: code,
    extensions: [javascript()],
  });
  const result = javascriptCompletionSource(
    new CompletionContext(state, position, explicit),
  );
  return result instanceof Promise || !result
    ? undefined
    : result.options.map(option => option.label);
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

test('completes string properties on the function argument', () => {
  expect(labels('(input) => input.title.')).toContain('toUpperCase');
  expect(labels('(input) => input.title.')).toContain('length');
});

test('completes properties on a string literal', () => {
  expect(labels('() => "foo".')).toContain('toUpperCase');
  expect(labels("() => 'foo'.toU")).toContain('toUpperCase');
});

test('completes common JavaScript globals', () => {
  expect(javascriptLabels('() => Math.')).toContain('max');
  expect(javascriptLabels('() => JSON.')).toContain('stringify');
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

test('does not complete page properties in default value expressions', () => {
  expect(labels('({title = ti') ?? []).not.toContain('title');
});

test('completes destructured variables in the function body', () => {
  const code = '({title}) => {\n  ti\n}';
  expect(labels(code, code.indexOf('ti') + 2)).toContain('title');
});

test('completes string properties on destructured variables', () => {
  const code = '({title}) => {\n  title.\n}';
  expect(labels(code, code.indexOf('.') + 1)).toContain('toUpperCase');
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
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
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
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
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
