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

export function indexToKey(index: number): number | undefined {
  if (9 < index) return undefined;
  if (index === 9) return 0;
  return index + 1;
}

import {contrast} from 'chroma-js';
export function textColorFromBgColor(hex: string): string {
  const minContrast = 7;
  if (contrast(hex, '#000000') >= minContrast) {
    return '#000000';
  } else {
    return '#FFFFFF';
  }
}

export function charLength(s: string): number {
  // TODO UAX#29
  return Array.from(s).length;
}
