import {CopyFunction} from '../function';
import {
  ACTIVE_POINTER_KEY,
  catalogRootKey,
  catalogShardKey,
  functionDocumentKey,
} from './keys';
import {InMemoryKeyValueStorage} from './memory-storage';
import {
  createFunctionRepository,
  CreateFunctionRepositoryOptions,
} from './repository';
import {refFromFunction} from './types';

export const BASE_TIME = new Date('2026-07-20T00:00:00.000Z');

export function makeFunction(
  id: string,
  overrides: Partial<CopyFunction> = {},
): CopyFunction {
  return {
    id,
    name: `name-${id}`,
    code: `return "${id}";`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    ...overrides,
  };
}

/** Deterministic id generator: seq-1, seq-2, ... */
export function sequentialIds(prefix = 'id'): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/** A clock the test advances explicitly. */
export class TestClock {
  constructor(private current: Date = BASE_TIME) {}

  now = (): Date => this.current;

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  set(date: Date): void {
    this.current = date;
  }
}

export interface Harness {
  storage: InMemoryKeyValueStorage;
  cache: InMemoryKeyValueStorage;
  clock: TestClock;
  repo: ReturnType<typeof createFunctionRepository>;
}

export function createHarness(
  overrides: Partial<CreateFunctionRepositoryOptions> = {},
): Harness {
  const storage = new InMemoryKeyValueStorage();
  const cache = new InMemoryKeyValueStorage();
  const clock = new TestClock();
  const repo = createFunctionRepository({
    storage,
    cache,
    now: clock.now,
    newId: sequentialIds(),
    ...overrides,
  });
  return {storage, cache, clock, repo};
}

/**
 * Writes a complete, valid snapshot (documents + one shard per group + root +
 * pointer) directly into storage, bypassing the repository.
 */
export async function seedSnapshot(
  storage: InMemoryKeyValueStorage,
  functions: CopyFunction[],
  opts: {
    catalogId?: string;
    createdAt?: string;
    documentIds?: string[];
    entriesPerShard?: number;
  } = {},
): Promise<void> {
  const catalogId = opts.catalogId ?? 'seed-catalog';
  const createdAt = opts.createdAt ?? BASE_TIME.toISOString();
  const documentIds =
    opts.documentIds ?? functions.map((_, i) => `seed-doc-${i + 1}`);
  const perShard = opts.entriesPerShard ?? Math.max(1, functions.length);

  const items: Record<string, unknown> = {};
  const refs = functions.map((fn, i) => {
    const documentId = documentIds[i];
    items[functionDocumentKey(documentId)] = {
      formatVersion: 1,
      documentId,
      createdAt,
      function: fn,
    };
    return refFromFunction(fn, documentId);
  });

  const shardIds: string[] = [];
  for (let i = 0; i < Math.max(1, Math.ceil(refs.length / perShard)); i++) {
    const shardId = `seed-shard-${i + 1}`;
    shardIds.push(shardId);
    items[catalogShardKey(shardId)] = {
      formatVersion: 1,
      catalogId,
      shardId,
      createdAt,
      entries: refs.slice(i * perShard, (i + 1) * perShard),
    };
  }

  items[catalogRootKey(catalogId)] = {
    formatVersion: 1,
    catalogId,
    createdAt,
    shardIds,
  };
  items[ACTIVE_POINTER_KEY] = {formatVersion: 1, catalogId};

  await storage.set(items);
}

export async function readPointerCatalogId(
  storage: InMemoryKeyValueStorage,
): Promise<string | undefined> {
  const raw = (await storage.get([ACTIVE_POINTER_KEY]))[ACTIVE_POINTER_KEY];
  return (raw as {catalogId?: string} | undefined)?.catalogId;
}

export async function catchAsync(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error;
  }
}

/** Lets queued microtasks (storage change notifications) run. */
export async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}
