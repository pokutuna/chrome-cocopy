import {afterEach, describe, expect, it, vi} from 'vitest';

import {detectLanguage} from './detect';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectLanguage', () => {
  it.each([
    ['ja', 'ja'],
    ['ja-JP', 'ja'],
    ['en', 'en'],
    ['en-US', 'en'],
    // Unknown languages fall back to English.
    ['fr-FR', 'en'],
  ])('maps navigator.language %s to %s', (input, expected) => {
    vi.stubGlobal('navigator', {language: input});
    expect(detectLanguage()).toBe(expected);
  });
});
