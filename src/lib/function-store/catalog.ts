import {catalogShardKey} from './keys';
import {CatalogShard} from './schema';
import {EFFECTIVE_ITEM_BYTES, itemByteSize} from './size';
import {CopyFunctionRef, QuotaError} from './types';

/**
 * Splits an ordered list of entries into Catalog Shards. Entries are scanned
 * from the start of the list; a new Shard begins whenever adding the next
 * entry would push the current Shard's serialized size (including its key)
 * over the effective per-item limit. Because the rule only depends on the
 * entry list and the limit, the same entries always split the same way,
 * regardless of which device performs the split.
 */
export function splitIntoShards(
  entries: CopyFunctionRef[],
  ctx: {catalogId: string; createdAt: string; newShardId: () => string},
): CatalogShard[] {
  const shards: CatalogShard[] = [];
  let currentEntries: CopyFunctionRef[] = [];
  let currentShardId = ctx.newShardId();

  const buildShard = (
    shardId: string,
    shardEntries: CopyFunctionRef[],
  ): CatalogShard => ({
    formatVersion: 1,
    catalogId: ctx.catalogId,
    shardId,
    createdAt: ctx.createdAt,
    entries: shardEntries,
  });

  const sizeOf = (shardId: string, shardEntries: CopyFunctionRef[]): number =>
    itemByteSize(catalogShardKey(shardId), buildShard(shardId, shardEntries));

  const rejectOversizedEntry = (
    entry: CopyFunctionRef,
    actual: number,
  ): never => {
    throw new QuotaError(
      `Function "${entry.id}" is too large to store: a single catalog entry must fit within ${EFFECTIVE_ITEM_BYTES} bytes.`,
      {limitKind: 'item-bytes', limit: EFFECTIVE_ITEM_BYTES, actual},
    );
  };

  for (const entry of entries) {
    const candidateEntries = [...currentEntries, entry];
    const candidateSize = sizeOf(currentShardId, candidateEntries);

    if (candidateSize <= EFFECTIVE_ITEM_BYTES) {
      currentEntries = candidateEntries;
      continue;
    }

    // The entry doesn't fit alongside existing entries in the current Shard.
    if (currentEntries.length === 0) {
      // A single entry alone already exceeds the limit: it can never fit in
      // any Shard, so reject the mutation outright.
      rejectOversizedEntry(entry, candidateSize);
    }

    // Close out the current Shard and start a new one with this entry alone.
    shards.push(buildShard(currentShardId, currentEntries));
    currentShardId = ctx.newShardId();

    const freshShardSize = sizeOf(currentShardId, [entry]);
    if (freshShardSize > EFFECTIVE_ITEM_BYTES) {
      rejectOversizedEntry(entry, freshShardSize);
    }
    currentEntries = [entry];
  }

  // Always emit at least one Shard, even for an empty entry list, so the
  // Catalog has a well-defined non-empty set of Shards.
  shards.push(buildShard(currentShardId, currentEntries));

  return shards;
}
