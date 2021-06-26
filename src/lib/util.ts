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

export function isColorCode(input: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(input);
}

export function isDev(): boolean {
  const version = chrome.runtime.getManifest()?.version_name;
  return !/^Build v\d+\.\d+.\d+(?:-\d+)?$/.test(version || '');
}
