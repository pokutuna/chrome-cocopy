/**
 * convert digit keycode to index based on Keyboard Layout
 */
export function codeToIndex(code: string): number | undefined {
  return {
    Digit1: 0,
    Digit2: 1,
    Digit3: 2,
    Digit4: 3,
    Digit5: 4,
    Digit6: 5,
    Digit7: 6,
    Digit8: 7,
    Digit9: 8,
    Digit0: 9,
    Numpad1: 0,
    Numpad2: 1,
    Numpad3: 2,
    Numpad4: 3,
    Numpad5: 4,
    Numpad6: 5,
    Numpad7: 6,
    Numpad8: 7,
    Numpad9: 8,
    Numpad0: 9,
  }[code];
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
