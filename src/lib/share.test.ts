import * as f from './function';
import * as s from './share';

test('encodeSharable & decodeSharable', () => {
  const fn = f.newFunction();
  const serialized = s.encodeSharable(fn);
  const deserialized = s.decodeSharable(serialized);
  expect(deserialized).not.toBe(null);

  delete (fn as Partial<f.CopyFunction>).id;
  delete (deserialized as Partial<f.CopyFunction>)!.id;
  expect(deserialized).toEqual(fn);
});
