import * as f from './function';

test('newFunction', () => {
  const fn = f.newFunction();
  expect(f.isCopyFunction(fn)).toBe(true);
});
