import * as ev from './eval';
import {PageTarget} from './target';

describe('evaluate', () => {
  const target: PageTarget = {
    type: 'page',
    title: 'Test Title',
    pageURL: 'https://example.test/some/page',
    content: '',
  };

  test('success', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => `[${t.title}](${t.pageURL})`',
      target,
    });
    expect(result).toEqual({
      result: '[Test Title](https://example.test/some/page)',
    });
  });

  test('success with number', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '(t) => t.title.length',
      target,
    });
    expect(result).toEqual({
      result: 10,
    });
  });

  test('success with null', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => null',
      target,
    });
    expect(result).toEqual({
      result: null,
    });
  });

  test('parse error with syntax error', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '}',
      target,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ParseError',
        message: expect.stringContaining('Unexpected token'),
      },
    });
  });

  test('parse error with not a function', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '123',
      target,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ParseError',
        message: expect.stringContaining('not a function'),
      },
    });
  });

  test('execution error with error', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => { throw new Error("simulated error") }',
      target,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ExecutionError',
        message: expect.stringContaining('simulated error'),
      },
    });
  });

  test('execution error with unacceptable value', async () => {
    const result = await ev.evaluate({
      command: 'eval',
      code: '() => ({ foo: "bar" })',
      target,
    });
    expect(result).toEqual({
      result: null,
      error: {
        type: 'ExecutionError',
        message: expect.stringContaining('returning value is not a one of'),
      },
    });
  });
});
