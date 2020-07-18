import * as util from './util';

import {chrome} from 'jest-chrome';

test('getActiveTab', async () => {
  chrome.tabs.query.mockImplementation((_info, cb) =>
    cb([{index: 0} as chrome.tabs.Tab])
  );
  await expect(util.getActiveTab()).resolves.toEqual({index: 0});

  chrome.tabs.query.mockImplementation((_info, cb) => cb([]));
  await expect(util.getActiveTab()).rejects.toEqual(expect.anything());
});

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
