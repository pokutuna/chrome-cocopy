import * as util from './util';

test('codeToIndex', () => {
  const cases = [
    {in: 'Digit1', out: 0},
    {in: 'Digit2', out: 1},
    {in: 'Digit9', out: 8},
    {in: 'Digit0', out: 9},
    {in: 'Numpad1', out: 0},
    {in: 'Numpad2', out: 1},
    {in: 'Numpad9', out: 8},
    {in: 'Numpad0', out: 9},
  ];
  cases.forEach(c => expect(util.codeToIndex(c.in)).toBe(c.out));
});

test('textColorFromBgColor', () => {
  expect(util.textColorFromBgColor('#000000')).toBe('#FFFFFF');
  expect(util.textColorFromBgColor('#FFFFFF')).toBe('#000000');
});
