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

// Loose variant accepts any formatVersion so callers can branch on it before
// deciding whether the rest of the value is safe to interpret (see
// UnsupportedVersionError in types.ts).
export const looseActivePointerSchema = v.strictObject({
  formatVersion: v.number(),
  catalogId: v.string(),
});
export type LooseActivePointer = v.InferOutput<typeof looseActivePointerSchema>;

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
