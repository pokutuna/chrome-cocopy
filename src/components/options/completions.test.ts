import {
  autocompletion,
  closeCompletion,
  CompletionContext,
  currentCompletions,
  selectedCompletionIndex,
  startCompletion,
} from '@codemirror/autocomplete';
import {javascript, javascriptLanguage} from '@codemirror/lang-javascript';
import {
  EditorState,
  EditorView,
  keymap,
  runScopeHandlers,
  Transaction,
} from '@uiw/react-codemirror';

import {
  additionalCompletionKeymap,
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
        additionalCompletionKeymap,
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  startCompletion(view);
  await new Promise(resolve => setTimeout(resolve, 200));

  expect(currentCompletions(view.state).map(option => option.label)).toContain(
    'title',
  );
  expect(
    view.state
      .facet(keymap)
      .flat()
      .map(binding => binding.key),
  ).toContain('Tab');
  view.destroy();
});

test('activates destructuring completions while typing', async () => {
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: '({',
      selection: {anchor: 2},
      extensions: [
        additionalCompletionKeymap,
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

test('accepts the selected completion with Tab', async () => {
  const code = '({ti';
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: code,
      selection: {anchor: code.length},
      extensions: [
        additionalCompletionKeymap,
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  startCompletion(view);
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(currentCompletions(view.state).map(option => option.label)).toContain(
    'title',
  );
  expect(
    runScopeHandlers(
      view,
      new KeyboardEvent('keydown', {key: 'Tab', code: 'Tab'}),
      'editor',
    ),
  ).toBe(true);

  expect(view.state.doc.toString()).toBe('({title');
  view.destroy();
});

test('uses Ctrl-N and Ctrl-P to move through completions', async () => {
  const code = '({}) => {}';
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: code,
      selection: {anchor: code.indexOf('}')},
      extensions: [
        additionalCompletionKeymap,
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  startCompletion(view);
  await new Promise(resolve => setTimeout(resolve, 200));

  expect(currentCompletions(view.state).length).toBeGreaterThan(1);
  expect(selectedCompletionIndex(view.state)).toBe(0);
  runScopeHandlers(
    view,
    new KeyboardEvent('keydown', {
      key: 'n',
      code: 'KeyN',
      ctrlKey: true,
    }),
    'editor',
  );
  expect(selectedCompletionIndex(view.state)).toBe(1);

  runScopeHandlers(
    view,
    new KeyboardEvent('keydown', {
      key: 'p',
      code: 'KeyP',
      ctrlKey: true,
    }),
    'editor',
  );
  expect(selectedCompletionIndex(view.state)).toBe(0);
  view.destroy();
});

test('closes completions with Ctrl-G', async () => {
  const code = '({}) => {}';
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: code,
      selection: {anchor: code.indexOf('}')},
      extensions: [
        additionalCompletionKeymap,
        javascript(),
        javascriptLanguage.data.of({autocomplete: cocopyCompletionSource}),
        javascriptLanguage.data.of({autocomplete: javascriptCompletionSource}),
        autocompletion(),
      ],
    }),
  });

  startCompletion(view);
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(currentCompletions(view.state).length).toBeGreaterThan(1);

  expect(
    runScopeHandlers(
      view,
      new KeyboardEvent('keydown', {
        key: 'g',
        code: 'KeyG',
        ctrlKey: true,
      }),
      'editor',
    ),
  ).toBe(true);
  expect(currentCompletions(view.state)).toEqual([]);
  expect(closeCompletion(view)).toBe(false);
  view.destroy();
});
