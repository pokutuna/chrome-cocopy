import * as f from './function';
import * as s from './share';

test('encodeSharable & decodeSharable', () => {
  const fn = f.newFunction();
  const serialized = s.encodeSharable(fn);
  const deserialized = s.decodeSharable(serialized);
  expect(deserialized).not.toBe(null);

  delete fn.id;
  delete deserialized!.id;
  expect(deserialized).toEqual(fn);
});
