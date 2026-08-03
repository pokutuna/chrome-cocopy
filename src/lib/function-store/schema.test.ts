import * as v from 'valibot';

import {
  activePointerV1Schema,
  catalogRootSchema,
  catalogShardSchema,
  functionDocumentSchema,
  looseActivePointerSchema,
} from './schema';

test('activePointerV1Schema accepts the design doc example', () => {
  const value = {
    formatVersion: 1,
    catalogId: '01J000000000000000000000',
  };

  expect(v.safeParse(activePointerV1Schema, value).success).toBe(true);
});

test('activePointerV1Schema rejects a non-1 formatVersion', () => {
  const value = {formatVersion: 2, catalogId: 'x'};
  expect(v.safeParse(activePointerV1Schema, value).success).toBe(false);
});

test('activePointerV1Schema rejects extra keys', () => {
  const value = {formatVersion: 1, catalogId: 'x', extra: true};
  expect(v.safeParse(activePointerV1Schema, value).success).toBe(false);
});

test('looseActivePointerSchema accepts a newer, unknown formatVersion', () => {
  const value = {formatVersion: 2, catalogId: 'x'};
  expect(v.safeParse(looseActivePointerSchema, value).success).toBe(true);
});

test('looseActivePointerSchema rejects a non-number formatVersion', () => {
  const value = {formatVersion: '1', catalogId: 'x'};
  expect(v.safeParse(looseActivePointerSchema, value).success).toBe(false);
});

test('catalogRootSchema accepts the design doc example', () => {
  const value = {
    formatVersion: 1,
    catalogId: '01J000000000000000000000',
    createdAt: '2026-07-20T00:00:00.000Z',
    shardIds: ['01J000000000000000000001', '01K000000000000000000002'],
  };

  expect(v.safeParse(catalogRootSchema, value).success).toBe(true);
});

test('catalogRootSchema rejects a non-ISO createdAt', () => {
  const value = {
    formatVersion: 1,
    catalogId: 'x',
    createdAt: 'not-a-date',
    shardIds: [],
  };
  expect(v.safeParse(catalogRootSchema, value).success).toBe(false);
});

test('catalogRootSchema rejects non-string shardIds', () => {
  const value = {
    formatVersion: 1,
    catalogId: 'x',
    createdAt: '2026-07-20T00:00:00.000Z',
    shardIds: [1, 2],
  };
  expect(v.safeParse(catalogRootSchema, value).success).toBe(false);
});

test('catalogShardSchema accepts the design doc example', () => {
  const value = {
    formatVersion: 1,
    catalogId: '01J000000000000000000000',
    shardId: '01J000000000000000000001',
    createdAt: '2026-07-20T00:00:00.000Z',
    entries: [
      {
        id: 'builtin-markdown',
        documentId: '01J000000000000000000002',
        version: 1,
        name: 'Markdown: [title](url)',
        pattern: null,
        theme: {
          textColor: '#000000',
          backgroundColor: '#f5f5f5',
        },
      },
    ],
  };

  expect(v.safeParse(catalogShardSchema, value).success).toBe(true);
});

test('catalogShardSchema accepts an empty entries array', () => {
  const value = {
    formatVersion: 1,
    catalogId: 'cat',
    shardId: 'shard',
    createdAt: '2026-07-20T00:00:00.000Z',
    entries: [],
  };
  expect(v.safeParse(catalogShardSchema, value).success).toBe(true);
});

test('catalogShardSchema rejects an entry with undefined pattern instead of null', () => {
  const value = {
    formatVersion: 1,
    catalogId: 'cat',
    shardId: 'shard',
    createdAt: '2026-07-20T00:00:00.000Z',
    entries: [
      {
        id: 'a',
        documentId: 'doc',
        version: 1,
        name: 'name',
        pattern: undefined,
        theme: {textColor: '#000000', backgroundColor: '#ffffff'},
      },
    ],
  };
  expect(v.safeParse(catalogShardSchema, value).success).toBe(false);
});

test('catalogShardSchema rejects an entry with extra keys', () => {
  const value = {
    formatVersion: 1,
    catalogId: 'cat',
    shardId: 'shard',
    createdAt: '2026-07-20T00:00:00.000Z',
    entries: [
      {
        id: 'a',
        documentId: 'doc',
        version: 1,
        name: 'name',
        pattern: null,
        theme: {textColor: '#000000', backgroundColor: '#ffffff'},
        extra: true,
      },
    ],
  };
  expect(v.safeParse(catalogShardSchema, value).success).toBe(false);
});

test('functionDocumentSchema accepts the design doc example', () => {
  const value = {
    formatVersion: 1,
    documentId: '01J000000000000000000000',
    createdAt: '2026-07-20T00:00:00.000Z',
    function: {
      id: 'builtin-markdown',
      name: 'Markdown: [title](url)',
      code: '...',
      version: 1,
      theme: {
        textColor: '#000000',
        backgroundColor: '#f5f5f5',
      },
    },
  };

  expect(v.safeParse(functionDocumentSchema, value).success).toBe(true);
});

test('functionDocumentSchema rejects an invalid nested function', () => {
  const value = {
    formatVersion: 1,
    documentId: 'doc',
    createdAt: '2026-07-20T00:00:00.000Z',
    function: {
      id: 'a',
      name: 'n',
      code: 'c',
      version: 2, // only version 1 is valid per copyFunctionSchema
      theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    },
  };
  expect(v.safeParse(functionDocumentSchema, value).success).toBe(false);
});

test('functionDocumentSchema rejects extra top-level keys', () => {
  const value = {
    formatVersion: 1,
    documentId: 'doc',
    createdAt: '2026-07-20T00:00:00.000Z',
    function: {
      id: 'a',
      name: 'n',
      code: 'c',
      version: 1,
      theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    },
    extra: true,
  };
  expect(v.safeParse(functionDocumentSchema, value).success).toBe(false);
});
