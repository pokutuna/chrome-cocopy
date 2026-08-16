import {describe, expect, it} from 'vitest';

import {en} from './messages.en';
import {ja} from './messages.ja';

/**
 * Flattens a catalog into "path:kind" entries. `tsc` already forces the
 * Japanese catalog onto `typeof en`, but a runtime walk still catches what
 * types cannot: values that are neither strings nor functions, and function
 * arity drift between languages (docs/i18n.md, "Catalog Tests").
 */
function shape(value: unknown, path: string, out: string[]): void {
  if (typeof value === 'string') {
    out.push(`${path}:string`);
    return;
  }
  if (typeof value === 'function') {
    out.push(`${path}:function/${value.length}`);
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value).sort()) {
      shape((value as Record<string, unknown>)[key], `${path}.${key}`, out);
    }
    return;
  }
  out.push(`${path}:unexpected(${typeof value})`);
}

function catalogShape(catalog: unknown): string[] {
  const out: string[] = [];
  shape(catalog, '', out);
  return out;
}

describe('message catalogs', () => {
  it('en and ja have the same key set and value kinds', () => {
    expect(catalogShape(ja)).toEqual(catalogShape(en));
  });

  it('contains only strings and functions', () => {
    for (const entry of catalogShape(en)) {
      expect(entry).not.toContain(':unexpected');
    }
  });
});
