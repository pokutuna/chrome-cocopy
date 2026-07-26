import {splitIntoShards} from './catalog';
import {catalogShardKey} from './keys';
import {EFFECTIVE_ITEM_BYTES, itemByteSize} from './size';
import {CopyFunctionRef, QuotaError} from './types';

function makeEntry(id: string, nameLength: number): CopyFunctionRef {
  return {
    id,
    documentId: `doc-${id}`,
    name: 'x'.repeat(nameLength),
    pattern: null,
    theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    version: 1,
  };
}

function makeCtx(shardIds: string[]) {
  let i = 0;
  return {
    catalogId: 'catalog-1',
    createdAt: '2026-07-20T00:00:00.000Z',
    newShardId: () => shardIds[i++] ?? `extra-shard-${i}`,
  };
}

test('returns a single empty shard for an empty entry list', () => {
  const shards = splitIntoShards([], makeCtx(['shard-1']));

  expect(shards).toHaveLength(1);
  expect(shards[0].entries).toEqual([]);
  expect(shards[0].shardId).toBe('shard-1');
  expect(shards[0].catalogId).toBe('catalog-1');
  expect(shards[0].createdAt).toBe('2026-07-20T00:00:00.000Z');
  expect(shards[0].formatVersion).toBe(1);
});

test('keeps all entries in one shard when well under the limit', () => {
  const entries = [makeEntry('a', 10), makeEntry('b', 10), makeEntry('c', 10)];
  const shards = splitIntoShards(entries, makeCtx(['shard-1']));

  expect(shards).toHaveLength(1);
  expect(shards[0].entries).toEqual(entries);
});

test('splits into a new shard exactly when the limit would be exceeded', () => {
  const ctx = makeCtx(['shard-1', 'shard-2']);

  // Build a first entry, then find a name length that puts the shard exactly
  // at the boundary, then verify one more entry tips it over into a new shard.
  const first = makeEntry('a', 10);
  const shardKey = catalogShardKey('shard-1');

  // Grow a second entry's name until adding it would just barely exceed
  // EFFECTIVE_ITEM_BYTES, to exercise the exact boundary condition.
  let nameLength = 1;
  let secondEntry = makeEntry('b', nameLength);
  const sizeWith = (entries: CopyFunctionRef[]) =>
    itemByteSize(shardKey, {
      formatVersion: 1,
      catalogId: ctx.catalogId,
      shardId: 'shard-1',
      createdAt: ctx.createdAt,
      entries,
    });

  while (sizeWith([first, secondEntry]) <= EFFECTIVE_ITEM_BYTES) {
    nameLength += 1;
    secondEntry = makeEntry('b', nameLength);
  }
  // secondEntry now overflows the shard by exactly 1 byte's worth of growth.
  expect(sizeWith([first, secondEntry])).toBeGreaterThan(EFFECTIVE_ITEM_BYTES);

  // One byte shorter must still fit in a single shard together with `first`.
  const fittingEntry = makeEntry('b', nameLength - 1);
  expect(sizeWith([first, fittingEntry])).toBeLessThanOrEqual(
    EFFECTIVE_ITEM_BYTES,
  );

  const fittingShards = splitIntoShards(
    [first, fittingEntry],
    makeCtx(['shard-1']),
  );
  expect(fittingShards).toHaveLength(1);
  expect(fittingShards[0].entries).toEqual([first, fittingEntry]);

  const overflowingShards = splitIntoShards([first, secondEntry], ctx);
  expect(overflowingShards).toHaveLength(2);
  expect(overflowingShards[0].entries).toEqual([first]);
  expect(overflowingShards[1].entries).toEqual([secondEntry]);
  expect(overflowingShards[0].shardId).toBe('shard-1');
  expect(overflowingShards[1].shardId).toBe('shard-2');
});

test('splitting the same entry list is deterministic', () => {
  const entries = Array.from({length: 50}, (_, i) => makeEntry(`f${i}`, 50));

  const shardIds1 = entries.map((_, i) => `shard-${i}`);
  const shardIds2 = entries.map((_, i) => `shard-${i}`);

  const result1 = splitIntoShards(entries, makeCtx(shardIds1));
  const result2 = splitIntoShards(entries, makeCtx(shardIds2));

  const entriesOf = (shards: ReturnType<typeof splitIntoShards>) =>
    shards.map(s => s.entries);

  expect(entriesOf(result1)).toEqual(entriesOf(result2));
  expect(result1.length).toBe(result2.length);
});

test('throws QuotaError when a single entry alone exceeds the effective limit', () => {
  const huge = makeEntry('huge', EFFECTIVE_ITEM_BYTES + 1000);

  expect(() => splitIntoShards([huge], makeCtx(['shard-1']))).toThrow(
    QuotaError,
  );
});

function catchError(fn: () => void): unknown {
  try {
    fn();
    return undefined;
  } catch (err) {
    return err;
  }
}

test('QuotaError from a single oversized entry carries limit details', () => {
  const huge = makeEntry('huge', EFFECTIVE_ITEM_BYTES + 1000);

  const err = catchError(() => splitIntoShards([huge], makeCtx(['shard-1'])));

  expect(err).toBeInstanceOf(QuotaError);
  const quotaErr = err as QuotaError;
  expect(quotaErr.code).toBe('quota');
  expect(quotaErr.details.limitKind).toBe('item-bytes');
  expect(quotaErr.details.limit).toBe(EFFECTIVE_ITEM_BYTES);
  expect(quotaErr.details.actual).toBeGreaterThan(EFFECTIVE_ITEM_BYTES);
});

test('an oversized entry after a fitting one still throws QuotaError for a fresh shard', () => {
  const small = makeEntry('small', 10);
  const huge = makeEntry('huge', EFFECTIVE_ITEM_BYTES + 1000);

  // `huge` cannot fit even alone in the *next* shard, so it must still throw
  // rather than silently being placed in an over-quota shard.
  expect(() =>
    splitIntoShards([small, huge], makeCtx(['shard-1', 'shard-2'])),
  ).toThrow(QuotaError);
});
