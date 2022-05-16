import * as ev from './eval';
import {FunctionArgument, EMPTY_MODIFIER} from './eval';

describe('evaluate', () => {
  const arg: FunctionArgument = {
    title: 'Test Title',
    url: 'https://example.test/some/page',
    content: '',
    modifier: EMPTY_MODIFIER,
  };

  test('success', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => `[${t.title}](${t.url})`',
      arg,
    });
    expect(result).toEqual({
      result: '[Test Title](https://example.test/some/page)',
    });
  });

  test('success with number', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => t.title.length',
      arg,
    });
    expect(result).toEqual({
      result: 10,
    });
  });

  test('success with null', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => null',
      arg,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ReturnsEmpty',
        name: 'Error',
        message: 'returning value is empty (undefined or null)',
      },
    });
  });

  test('success with modifier', async () => {
    const code =
      '({title, modifier}) => modifier.shift ? title + " (with Shift)" : title';

    expect(
      await ev.evaluate({
        command: 'eval',
        code,
        arg,
      })
    ).toEqual({
      result: 'Test Title',
    });

    expect(
      await ev.evaluate({
        command: 'eval',
        code,
        arg: {
          ...arg,
          modifier: {...EMPTY_MODIFIER, shift: true},
        },
      })
    ).toEqual({
      result: 'Test Title (with Shift)',
    });

    expect(
      await ev.evaluate({
        command: 'eval',
        code,
        arg: {
          ...arg,
          modifier: {...EMPTY_MODIFIER, shift: true, alt: true},
        },
      })
    ).toEqual({
      result: 'Test Title (with Shift)',
    });
  });

  test('parse error with syntax error', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '}',
      arg,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ParseError',
        name: 'SyntaxError',
        message: expect.stringContaining('Unexpected token'),
      },
    });
  });

  test('parse error with not a function', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '123',
      arg,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ParseError',
        name: 'Error',
        message: expect.stringContaining('not a function'),
      },
    });
  });

  test('execution error with error', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => { throw new Error("simulated error") }',
      arg,
    });
    expect(result).toEqual({
      result: undefined,
      error: {
        type: 'ExecutionError',
        name: 'Error',
        message: expect.stringContaining('simulated error'),
      },
    });
  });

  test('execution error with unacceptable value', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => ({ foo: "bar" })',
      arg,
    });
    expect(result).toEqual({
      result: {foo: 'bar'},
      error: {
        type: 'ExecutionError',
        name: 'Error',
        message: expect.stringContaining('returning value is not one of'),
      },
    });
  });
});
