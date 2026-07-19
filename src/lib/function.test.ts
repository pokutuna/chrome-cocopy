import * as f from './function';

test('isCopyFunction', () => {
  const fn = f.newFunction();
  expect(f.isCopyFunction(fn)).toBe(true);

  fn.theme.textColor = 'red'; // not HEX
  expect(f.isCopyFunction(fn)).toBe(false);
});

test('isCopyFunction rejects invalid object shapes', () => {
  const fn = f.newFunction();

  expect(f.isCopyFunction({...fn, version: 2})).toBe(false);
  expect(f.isCopyFunction({...fn, extra: true})).toBe(false);
  expect(f.isCopyFunction({...fn, theme: {...fn.theme, extra: true}})).toBe(
    false,
  );
  expect(f.isCopyFunction(null)).toBe(false);
});
