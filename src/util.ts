export function getActiveTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabs && tabs[0] ? resolve(tabs[0]) : reject(new Error('no active tabs'));
    });
  });
}

/**
 * convert number to index based on Keyboard Layout
 * @param a single char of digit.
 */
export function keyToIndex(key: string): number {
  const k = parseInt(key, 10);
  return k !== 0 ? k - 1 : 9;
}
