import * as f from './function';

test('isCopyFunction', () => {
  const fn = f.newFunction();
  expect(f.isCopyFunction(fn)).toBe(true);

  fn.theme.textColor = 'red'; // not HEX
  expect(f.isCopyFunction(fn)).toBe(false);
});
