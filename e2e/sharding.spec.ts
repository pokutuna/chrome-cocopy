// Catalog sharding and the effective capacity limits, seen from the UI
// (docs/function-storage.md, "Catalog Shard" / "Capacity Model").
//
// Seeding goes through the same `splitIntoShards` the repository commits with,
// so a catalog that spans several Shards here spans the same Shards in
// production. What these specs add over the unit tests is that the UI walks
// Root -> Shards -> entries in the right order, and that a rejected mutation
// leaves the stored snapshot intact.

import {test, expect} from './fixtures';
import {
  readShardCount,
  readStoredFunctionNames,
  readSyncUsage,
  seedFunctionStore,
  type SeedFunction,
} from './function-store';

const EFFECTIVE_TOTAL_BYTES = 92_160;

/**
 * A function whose catalog entry is deliberately bulky: the entry carries the
 * name and pattern (not the code), so padding those is what forces the
 * catalog to split across Shards.
 */
function bulkyFunction(index: number): SeedFunction {
  const label = String(index).padStart(3, '0');
  return {
    id: `shard-fn-${label}`,
    // ~200 bytes of name per entry, so ~7,372 bytes of Shard fits roughly 30.
    name: `Shard Function ${label} ${'n'.repeat(180)}`,
    code: `() => "${label}"`,
    pattern: `^https://example\\.com/${label}/${'p'.repeat(120)}`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#eeeeee'},
  };
}

test('lists a catalog split across multiple shards in order', async ({
  context,
  extensionId,
}) => {
  const functions = Array.from({length: 60}, (_, i) => bulkyFunction(i));

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  const seeded = await seedFunctionStore(options, functions);

  // The seed really is split; otherwise this spec would silently degrade into
  // the single-Shard case the other specs already cover.
  expect(seeded.shardIds.length).toBeGreaterThan(1);
  await options.reload();

  await expect.poll(() => readShardCount(options)).toBe(seeded.shardIds.length);

  // Every function shows up, in catalog order, across the Shard boundaries.
  // Matching on the stable prefix keeps the assertion readable despite the
  // padding that forced the split.
  const rendered = options.locator('[class*="functionName"]');
  const expectedOrder = functions.map((_, i) => String(i).padStart(3, '0'));

  const renderedOrder = async () =>
    (await rendered.allTextContents())
      .map(text => /^Shard Function (\d{3})/.exec(text.trim())?.[1])
      .filter((n): n is string => n !== undefined);

  // Waiting on the row count first means the ordering assertion below always
  // reads a fully rendered list rather than racing React's first paint.
  const rows = options.locator('[class*="functionName"]', {
    hasText: /^Shard Function \d{3}/,
  });
  await expect(rows).toHaveCount(functions.length);
  await expect.poll(renderedOrder).toEqual(expectedOrder);

  // The order survives a reload, i.e. it comes from the catalog rather than
  // from whatever order the Shard reads happened to resolve in.
  await options.reload();
  await expect(rows).toHaveCount(functions.length);
  await expect.poll(renderedOrder).toEqual(expectedOrder);
});

test('refuses to save past the effective quota and leaves the stored snapshot intact', async ({
  context,
  extensionId,
}) => {
  // Fill sync close to the effective total so that one more sizeable function
  // cannot fit. The code (not the entry) is padded here: it lives in the
  // Function Document, which is what makes usage grow without splitting the
  // catalog into an unwieldy number of Shards.
  const filler: SeedFunction[] = Array.from({length: 14}, (_, i) => ({
    id: `quota-fn-${i}`,
    name: `Quota Function ${i}`,
    code: `() => "${'x'.repeat(5_800)}"`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#eeeeee'},
  }));

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedFunctionStore(options, filler);
  await options.reload();

  const usage = await readSyncUsage(options);
  expect(usage).toBeLessThan(EFFECTIVE_TOTAL_BYTES);
  // Close enough that another ~6 KB function cannot be committed.
  expect(usage).toBeGreaterThan(EFFECTIVE_TOTAL_BYTES - 12_000);

  const before = await readStoredFunctionNames(options);
  expect(before).toHaveLength(filler.length);

  // Try to add one more large function through the editor.
  await options.getByText('Create New Function').click();
  await options.locator('#name').fill('Quota Overflow');
  await options.locator('#code').fill(`() => "${'y'.repeat(5_800)}"`);

  const saveButton = options.getByRole('button', {name: 'Save'});
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // The commit is rejected before anything is written, and the editor says so.
  await expect(
    options.getByText(/Not enough sync storage to save this/),
  ).toBeVisible();

  // The previously stored functions are untouched: same names, same order.
  await expect.poll(() => readStoredFunctionNames(options)).toEqual(before);

  // And the rejection is durable rather than an in-memory-only refusal.
  await options.reload();
  await expect.poll(() => readStoredFunctionNames(options)).toEqual(before);
  await expect(options.getByText('Quota Overflow')).toHaveCount(0);
});
