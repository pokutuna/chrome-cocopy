// Pointer key has no format-version segment: it must stay readable across
// storage format versions, so callers can always "read the Pointer first"
// regardless of which version its value describes.
export const ACTIVE_POINTER_KEY = 'cocopy:function-store:active';

export const V1_PREFIX = 'cocopy:function-store:v1:';

export function catalogRootKey(catalogId: string): string {
  return `${V1_PREFIX}catalog:${catalogId}`;
}

export function catalogShardKey(shardId: string): string {
  return `${V1_PREFIX}catalog-shard:${shardId}`;
}

export function functionDocumentKey(documentId: string): string {
  return `${V1_PREFIX}function:${documentId}`;
}

export function isFunctionStoreV1Key(key: string): boolean {
  return key.startsWith(V1_PREFIX);
}

// crypto.randomUUID() is used for all generated ids (catalogId, shardId,
// documentId). The design doc's examples show ULID-style ids, but those are
// illustrative only: nothing in the design depends on lexicographic id
// ordering, so a UUID is sufficient.
export function newId(): string {
  return crypto.randomUUID();
}
