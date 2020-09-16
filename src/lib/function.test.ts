import * as f from './function';

test('encodeSharable & decodeSharable', () => {
  const fn = f.newFunction();
  const serialized = f.encodeSharable(fn);
  const deserialized = f.decodeSharable(serialized);
  expect(deserialized).not.toBe(null);

  delete fn.id;
  delete deserialized!.id;
  expect(deserialized).toEqual(fn);
});
