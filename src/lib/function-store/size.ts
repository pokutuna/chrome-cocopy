// storage.sync quota profile shared by Chrome and Firefox.
export const QUOTA_BYTES = 102_400;
export const QUOTA_BYTES_PER_ITEM = 8_192;
export const MAX_ITEMS = 512;

// Effective limits leave headroom for the copy-on-write staging area used
// while committing a new snapshot (see docs/function-storage.md, Effective
// Limits).
export const EFFECTIVE_TOTAL_BYTES = 92_160; // 90% of QUOTA_BYTES
export const EFFECTIVE_ITEM_BYTES = 7_372; // 90% of QUOTA_BYTES_PER_ITEM
export const EFFECTIVE_MAX_ITEMS = 460; // 90% of MAX_ITEMS
export const MAX_FUNCTIONS = 128;

const encoder = new TextEncoder();

/**
 * Byte size of one storage item as measured by WebExtensions storage quotas:
 * key length plus the JSON-serialized value length, both in UTF-8 bytes.
 */
export function itemByteSize(key: string, value: unknown): number {
  return (
    encoder.encode(key).length + encoder.encode(JSON.stringify(value)).length
  );
}

/** Sum of itemByteSize over every key/value pair, matching getAll()'s shape. */
export function totalByteSize(items: Record<string, unknown>): number {
  let total = 0;
  for (const [key, value] of Object.entries(items)) {
    total += itemByteSize(key, value);
  }
  return total;
}
