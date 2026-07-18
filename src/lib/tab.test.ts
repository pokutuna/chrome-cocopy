import {vi} from 'vitest';
import * as tab from './tab';

test('getActiveTab', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(async () => {
    return [{index: 0} as chrome.tabs.Tab];
  });

  await expect(tab.getActiveTab()).resolves.toEqual({index: 0});

  vi.mocked(chrome.tabs.query).mockImplementation(async () => []);
  await expect(tab.getActiveTab()).rejects.toEqual(expect.anything());
});
