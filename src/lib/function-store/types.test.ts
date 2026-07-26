import {newFunction} from '../function';
import {refFromFunction} from './types';

test('refFromFunction derives a ref from a CopyFunction', () => {
  const fn = newFunction();
  fn.pattern = 'https://example.com/.*';

  const ref = refFromFunction(fn, 'doc-1');

  expect(ref).toEqual({
    id: fn.id,
    documentId: 'doc-1',
    name: fn.name,
    pattern: fn.pattern,
    theme: fn.theme,
    version: fn.version,
  });
});

test('refFromFunction normalizes an undefined pattern to null', () => {
  const fn = newFunction();
  delete fn.pattern;

  const ref = refFromFunction(fn, 'doc-1');

  expect(ref.pattern).toBeNull();
});

test('refFromFunction normalizes an empty string pattern to null', () => {
  const fn = newFunction();
  fn.pattern = '';

  const ref = refFromFunction(fn, 'doc-1');

  expect(ref.pattern).toBeNull();
});
