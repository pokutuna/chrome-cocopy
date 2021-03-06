import * as util from './util';

test('keyToIndex', () => {
  const cases = [
    {in: '1', out: 0},
    {in: '2', out: 1},
    {in: '3', out: 2},
    {in: '4', out: 3},
    {in: '5', out: 4},
    {in: '6', out: 5},
    {in: '7', out: 6},
    {in: '8', out: 7},
    {in: '9', out: 8},
    {in: '0', out: 9},
  ];
  cases.forEach(c => expect(util.keyToIndex(c.in)).toBe(c.out));
});

test('textColorFromBgColor', () => {
  expect(util.textColorFromBgColor('#000000')).toBe('#FFFFFF');
  expect(util.textColorFromBgColor('#FFFFFF')).toBe('#000000');
});
