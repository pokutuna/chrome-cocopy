import * as tab from './tab';

import {chrome} from 'jest-chrome';

test('getActiveTab', async () => {
  chrome.tabs.query.mockImplementation(async () => {
    return [{index: 0} as chrome.tabs.Tab];
  });

  await expect(tab.getActiveTab()).resolves.toEqual({index: 0});

  chrome.tabs.query.mockImplementation(async () => []);
  await expect(tab.getActiveTab()).rejects.toEqual(expect.anything());
});
