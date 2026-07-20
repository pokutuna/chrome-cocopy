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

test('getTabContent uses the promise-based scripting API', async () => {
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => [
    {documentId: 'test', frameId: 0, result: '<html></html>'},
  ]);

  await expect(tab.getTabContent({id: 42} as chrome.tabs.Tab)).resolves.toBe(
    '<html></html>',
  );
  expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
    target: {tabId: 42},
    func: expect.any(Function),
  });
});

test('getTabContent returns undefined when a tab has no id', async () => {
  await expect(
    tab.getTabContent({} as chrome.tabs.Tab),
  ).resolves.toBeUndefined();
  expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
});
