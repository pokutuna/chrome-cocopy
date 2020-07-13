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
