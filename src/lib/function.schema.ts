import * as v from 'valibot';

const hexColorSchema = v.pipe(
  v.string(),
  v.regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
);

export const copyFunctionSchema = v.strictObject({
  id: v.string(),
  name: v.string(),
  code: v.string(),
  pattern: v.optional(v.string()),
  version: v.literal(1),
  theme: v.strictObject({
    textColor: hexColorSchema,
    backgroundColor: hexColorSchema,
  }),
});
