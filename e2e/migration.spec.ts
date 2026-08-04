// Legacy -> FunctionStore migration, exercised end to end.
//
// This is the only spec that still seeds the pre-FunctionStore
// `chrome.storage.sync["functions"]` array. Migration runs inside the
// repository's `onMissingActivePointer` hook, so simply opening options or the
// popup with legacy data present drives the whole path
// (docs/function-storage.md, "Migration Trigger" / "Migration Tests").
//
import type {CopyFunction} from '../src/lib/function';
import {test, expect} from './fixtures';
import {
  readActivePointer,
  readLegacyBackup,
  readLegacyFunctions,
  readMigrationResult,
  readStoredFunctionNames,
  seedLegacyFunctions,
} from './function-store';

function legacyFunction(
  id: string,
  name: string,
  overrides: Partial<CopyFunction> = {},
): CopyFunction {
  return {
    id,
    name,
    code: `() => "${id}"`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#eeeeee'},
    ...overrides,
  };
}

const legacyThree = [
  legacyFunction('legacy-a', 'Legacy Function A'),
  legacyFunction('legacy-b', 'Legacy Function B'),
  legacyFunction('legacy-c', 'Legacy Function C'),
];

/**
 * Opens options on an extension page, seeds legacy data, then reloads so the
 * repository initialises against it. The first `goto` only exists to get an
 * extension origin from which `chrome.storage` is reachable; the reload after
 * seeding is what triggers migration.
 */
async function openOptionsWithLegacy(
  context: import('@playwright/test').BrowserContext,
  extensionId: string,
  legacy: unknown,
) {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedLegacyFunctions(options, legacy);
  await options.reload();
  return options;
}

/**
 * Opens the "Legacy Functions" page and returns its section. The backup
 * lives on its own `/legacy` route, so the options root only carries a banner
 * linking to it; asserting on the root page finds the banner text but none of
 * the controls.
 *
 * `LegacyBackup` reads the recorded migration result concurrently with the
 * migration that writes it, so on the very first load the status can still say
 * "not recorded". Callers that assert on the recorded outcome reload first.
 */
async function openLegacySection(page: import('@playwright/test').Page) {
  await page.goto(`${page.url().split('#')[0]}#/legacy`);
  const section = page
    .locator('div')
    .filter({has: page.getByRole('heading', {name: 'Legacy Functions'})})
    .last();
  await expect(section).toBeVisible();
  return section;
}

test('opening options migrates legacy data, preserving content and order', async ({
  context,
  extensionId,
}) => {
  const options = await openOptionsWithLegacy(
    context,
    extensionId,
    legacyThree,
  );

  // The migrated functions render in the list in their original order.
  const names = options.locator('[class*="functionName"]', {
    hasText: /^Legacy Function [ABC]$/,
  });
  await expect(names).toHaveText([
    'Legacy Function A',
    'Legacy Function B',
    'Legacy Function C',
  ]);

  // An Active Pointer now exists and the catalog holds the same order.
  await expect.poll(() => readActivePointer(options)).toBeTruthy();
  await expect
    .poll(() => readStoredFunctionNames(options))
    .toEqual(['Legacy Function A', 'Legacy Function B', 'Legacy Function C']);

  // The original is backed up to storage.local and the outcome is recorded.
  // Compared structurally: the backup serializes what was read back from
  // chrome.storage, which returns objects with their keys sorted, so the
  // string never matches a stringify of the literal above byte for byte.
  await expect
    .poll(async () => JSON.parse((await readLegacyBackup(options)) ?? 'null'))
    .toEqual(legacyThree);
  const result = await readMigrationResult(options);
  expect(result?.outcome).toBe('completed');
  expect(result?.legacyExisted).toBe(true);
  expect(result?.migratedCount).toBe(3);
  expect(result?.skipped).toEqual([]);

  // ...and the legacy sync key itself is left exactly as it was.
  expect(await readLegacyFunctions(options)).toEqual(legacyThree);

  // The Legacy Functions section reports the completed migration.
  await options.reload();
  const section = await openLegacySection(options);
  await expect(section.getByText('migrated', {exact: false})).toBeVisible();
  await expect(
    section.getByRole('button', {name: 'Export original JSON'}),
  ).toBeEnabled();

  // Reopening does not re-migrate: the recorded timestamp stays put.
  await expect(names).toHaveText([
    'Legacy Function A',
    'Legacy Function B',
    'Legacy Function C',
  ]);
  expect((await readMigrationResult(options))?.migratedAt).toBe(
    result?.migratedAt,
  );
});

test('partially migrates legacy data, offering the rejected function in the backup section', async ({
  context,
  extensionId,
}) => {
  // `((` is a syntactically valid string but not a valid regular expression,
  // so this function is skipped with reason 'pattern' while the others
  // migrate (docs: "Partial Migration").
  const legacy = [
    legacyThree[0],
    legacyFunction('legacy-bad', 'Legacy Broken Pattern', {pattern: '(('}),
    legacyThree[2],
  ];
  const options = await openOptionsWithLegacy(context, extensionId, legacy);

  await expect
    .poll(() => readStoredFunctionNames(options))
    .toEqual(['Legacy Function A', 'Legacy Function C']);
  await expect.poll(() => readActivePointer(options)).toBeTruthy();

  const result = await readMigrationResult(options);
  expect(result?.outcome).toBe('completed');
  expect(result?.migratedCount).toBe(2);
  expect(result?.skipped).toEqual([
    {id: 'legacy-bad', name: 'Legacy Broken Pattern', reason: 'pattern'},
  ]);

  // The section explains why the function was left behind, with a route into
  // the editor to repair it.
  await options.reload();
  const section = await openLegacySection(options);
  await expect(section.getByText('migrated', {exact: false})).toBeVisible();

  // Entries render collapsed; the state and its actions are in the expanded
  // body, opened by clicking the row.
  await section.getByText('Legacy Broken Pattern').click();
  await expect(
    section.getByText(
      'Cannot be imported: its URL pattern is not a valid regular expression',
    ),
  ).toBeVisible();

  const fix = section.getByRole('link', {name: 'Fix in editor'});
  await expect(fix).toBeVisible();
  await fix.click();

  // The editor opens pre-filled with the salvageable fields; the invalid
  // pattern is replaced with an editable default so the user can fix it.
  await expect(
    options.getByRole('heading', {name: 'Install Function'}),
  ).toBeVisible();
  await expect(options.locator('#name')).toHaveValue('Legacy Broken Pattern');

  // Migrating never consumes the legacy data.
  expect(await readLegacyFunctions(options)).toEqual(legacy);
});

test('imports a function the migration left behind, without touching the legacy data', async ({
  context,
  extensionId,
}) => {
  const options = await openOptionsWithLegacy(
    context,
    extensionId,
    legacyThree,
  );
  await expect
    .poll(() => readStoredFunctionNames(options))
    .toEqual(['Legacy Function A', 'Legacy Function B', 'Legacy Function C']);

  // Deleting a migrated function makes the backup section offer to put it
  // back, which is the same Import path a skipped function would take.
  options.on('dialog', dialog => dialog.accept());
  await options.getByText('Legacy Function B').first().click();
  await options.getByRole('button', {name: /Delete/}).click();
  await expect
    .poll(() => readStoredFunctionNames(options))
    .toEqual(['Legacy Function A', 'Legacy Function C']);

  const section = await openLegacySection(options);
  // Expand the deleted function's row to reach its Import action.
  await section.getByText('Legacy Function B').click();
  const importButton = section.getByRole('button', {name: 'Import'});
  await expect(importButton).toBeVisible();
  await importButton.click();

  // Re-imported under its legacy id, appended to the catalog; keeping the id
  // is what marks the row as migrated on later visits.
  await expect
    .poll(() => readStoredFunctionNames(options))
    .toEqual(['Legacy Function A', 'Legacy Function C', 'Legacy Function B']);

  // The legacy snapshot is unchanged by the import. The backup is compared
  // structurally: chrome.storage returns objects with sorted keys, so its
  // serialization never matches a stringify of the literal byte for byte.
  expect(await readLegacyFunctions(options)).toEqual(legacyThree);
  expect(JSON.parse((await readLegacyBackup(options)) ?? 'null')).toEqual(
    legacyThree,
  );
});

test('does not create an Active Pointer when the legacy value is not an array', async ({
  context,
  extensionId,
}) => {
  const legacy = {not: 'an array'};
  const options = await openOptionsWithLegacy(context, extensionId, legacy);

  // The list reports the failure rather than silently showing defaults.
  const alert = options.getByRole('alert').first();
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/not an array/i);

  // No Pointer was written, so nothing was published...
  expect(await readActivePointer(options)).toBeUndefined();
  // ...and the legacy value is untouched, ready for a retry.
  expect(await readLegacyFunctions(options)).toEqual(legacy);
  // The backup is only written for values that read as an array.
  expect(await readLegacyBackup(options)).toBeUndefined();

  await expect
    .poll(async () => (await readMigrationResult(options))?.outcome)
    .toBe('failed');
  expect((await readMigrationResult(options))?.error).toMatch(/not an array/i);

  // The backup section stays reachable so the original can still be exported.
  // Reloaded first: on the load that ran the migration, the section had
  // already read storage.local before the result was recorded.
  await options.reload();
  const section = await openLegacySection(options);
  await expect(
    section.getByText('migration failed', {exact: false}),
  ).toBeVisible();
  await expect(
    section.getByRole('button', {name: 'Export original JSON'}),
  ).toBeEnabled();

  // Reopening retries rather than giving up, and still writes no Pointer.
  expect(await readActivePointer(options)).toBeUndefined();
  await expect(options.getByRole('alert').first()).toContainText(
    /not an array/i,
  );
});

test('opening the popup migrates legacy data and lists the migrated functions', async ({
  context,
  extensionId,
}) => {
  const seeder = await context.newPage();
  await seeder.goto(`chrome-extension://${extensionId}/options.html`);
  await seedLegacyFunctions(seeder, legacyThree);
  await seeder.close();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(popup.getByText('Legacy Function A')).toBeVisible();
  await expect(popup.getByText('Legacy Function B')).toBeVisible();
  await expect(popup.getByText('Legacy Function C')).toBeVisible();

  await expect.poll(() => readActivePointer(popup)).toBeTruthy();
  await expect
    .poll(() => readStoredFunctionNames(popup))
    .toEqual(['Legacy Function A', 'Legacy Function B', 'Legacy Function C']);
  expect(await readLegacyFunctions(popup)).toEqual(legacyThree);
});

test('seeds the default functions when there is no legacy data', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.evaluate(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
  });
  await options.reload();

  await expect.poll(() => readActivePointer(options)).toBeTruthy();
  await expect
    .poll(async () => (await readStoredFunctionNames(options)).length)
    .toBeGreaterThan(0);

  const result = await readMigrationResult(options);
  expect(result?.outcome).toBe('completed');
  expect(result?.legacyExisted).toBe(false);

  // Nothing to recover, so the temporary backup section stays hidden.
  await expect(
    options.getByRole('heading', {name: 'Legacy Functions'}),
  ).toHaveCount(0);
});
