import * as v from 'valibot';

import {copyFunctionSchema, hexColorSchema} from '../function.schema';

const copyFunctionRefSchema = v.strictObject({
  id: v.string(),
  documentId: v.string(),
  name: v.string(),
  pattern: v.nullable(v.string()),
  theme: v.strictObject({
    textColor: hexColorSchema,
    backgroundColor: hexColorSchema,
  }),
  version: v.number(),
});

// Validates only formatVersion, ignoring unknown fields, so callers can
// branch to UnsupportedVersionError before interpreting the rest.
export const looseActivePointerSchema = v.looseObject({
  formatVersion: v.number(),
});

export const activePointerV1Schema = v.strictObject({
  formatVersion: v.literal(1),
  catalogId: v.string(),
});
export type ActivePointerV1 = v.InferOutput<typeof activePointerV1Schema>;

export const catalogRootSchema = v.strictObject({
  formatVersion: v.literal(1),
  catalogId: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  shardIds: v.array(v.string()),
});
export type CatalogRoot = v.InferOutput<typeof catalogRootSchema>;

export const catalogShardSchema = v.strictObject({
  formatVersion: v.literal(1),
  catalogId: v.string(),
  shardId: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  entries: v.array(copyFunctionRefSchema),
});
export type CatalogShard = v.InferOutput<typeof catalogShardSchema>;

export const functionDocumentSchema = v.strictObject({
  formatVersion: v.literal(1),
  documentId: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  function: copyFunctionSchema,
});
export type FunctionDocument = v.InferOutput<typeof functionDocumentSchema>;
