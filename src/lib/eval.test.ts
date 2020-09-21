import * as ev from './eval';
import {Page} from './page';

describe('evaluate', () => {
  const page: Page = {
    title: 'Test Title',
    url: 'https://example.test/some/page',
    content: '',
  };

  test('success', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => `[${t.title}](${t.url})`',
      page,
    });
    expect(result).toEqual({
      result: '[Test Title](https://example.test/some/page)',
    });
  });

  test('success with number', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => t.title.length',
      page,
    });
    expect(result).toEqual({
      result: 10,
    });
  });

  test('success with null', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => null',
      page,
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

  test('parse error with syntax error', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '}',
      page,
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
      page,
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
      page,
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
      page,
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
