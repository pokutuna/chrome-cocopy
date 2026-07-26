import {itemByteSize, totalByteSize} from './size';

test('itemByteSize measures ASCII key and value as UTF-8 bytes', () => {
  const key = 'cocopy:function-store:v1:function:abc';
  const value = {a: 1};
  const expected = key.length + JSON.stringify(value).length;

  expect(itemByteSize(key, value)).toBe(expected);
});

test('itemByteSize counts multibyte characters by their UTF-8 byte length', () => {
  // Japanese characters are 3 bytes each in UTF-8; 1 char is 1 code point.
  const key = 'k';
  const value = '日本語';
  const utf8Length = new TextEncoder().encode(JSON.stringify(value)).length;

  expect(utf8Length).toBe(1 + 3 * 3 + 1); // quotes (2) + 3 chars * 3 bytes
  expect(itemByteSize(key, value)).toBe(key.length + utf8Length);
});

test('itemByteSize counts emoji (surrogate pairs) by their UTF-8 byte length', () => {
  const key = 'k';
  const value = '🎉';
  // U+1F389 is encoded as 4 bytes in UTF-8, but as a JS string it is 2 UTF-16
  // code units (surrogate pair), so .length-based measurement would be wrong.
  const utf8Length = new TextEncoder().encode(JSON.stringify(value)).length;

  expect(value.length).toBe(2);
  expect(utf8Length).toBe(2 + 4); // quotes (2) + 4 bytes
  expect(itemByteSize(key, value)).toBe(key.length + utf8Length);
});

test('totalByteSize sums itemByteSize over every item', () => {
  const items = {
    a: 'hello',
    b: '日本語',
  };

  const expected = itemByteSize('a', 'hello') + itemByteSize('b', '日本語');

  expect(totalByteSize(items)).toBe(expected);
});

test('totalByteSize is 0 for an empty item map', () => {
  expect(totalByteSize({})).toBe(0);
});
