import * as ev from './eval';
import {PageTarget} from './target';

describe('evaluate', () => {
  const target: PageTarget = {
    type: 'page',
    title: 'Test Title',
    pageURL: 'https://example.test/some/page',
  };

  test('success', () => {
    const result = ev.evaluate({
      code: '(t) => `[${t.title}](${t.pageURL})`',
      target,
    });
    expect(result).toEqual({
      result: '[Test Title](https://example.test/some/page)',
    });
  });

  test('success with number', () => {
    const result = ev.evaluate({
      code: '(t) => t.title.length',
      target,
    });
    expect(result).toEqual({
      result: 10,
    });
  });

  test('success with null', () => {
    const result = ev.evaluate({
      code: '() => null',
      target,
    });
    expect(result).toEqual({
      result: null,
    });
  });

  test('parse error with syntax error', () => {
    const result = ev.evaluate({
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

  test('parse error with not a function', () => {
    const result = ev.evaluate({
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

  test('execution error with error', () => {
    const result = ev.evaluate({
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

  test('execution error with unacceptable value', () => {
    const result = ev.evaluate({
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
