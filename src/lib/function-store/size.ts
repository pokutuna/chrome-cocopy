// storage.sync quota profile shared by Chrome and Firefox.
const QUOTA_BYTES = 102_400;
const QUOTA_BYTES_PER_ITEM = 8_192;
const MAX_ITEMS = 512;

// Effective limits (90% of quota) leave headroom for the copy-on-write
// staging area used while committing a new snapshot (see
// docs/function-storage.md, Effective Limits).
export const EFFECTIVE_TOTAL_BYTES = Math.floor(QUOTA_BYTES * 0.9); // 92,160
export const EFFECTIVE_ITEM_BYTES = Math.floor(QUOTA_BYTES_PER_ITEM * 0.9); // 7,372
export const EFFECTIVE_MAX_ITEMS = Math.floor(MAX_ITEMS * 0.9); // 460
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
