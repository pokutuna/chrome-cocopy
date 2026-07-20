import {test, expect, EXTENSION_ID} from './fixtures';

// Minimal CopyFunction fixtures matching src/lib/function.ts's CopyFunction
// shape / src/lib/function.schema.ts. `pattern` is intentionally omitted
// so the function is shown regardless of the active tab's URL
// (see filterFunctions in src/lib/function.ts).
const seedFunctions = [
  {
    id: 'e2e-title-url',
    name: 'E2E: title and url',
    code: '({title, url}) => [title, url].join(" ")',
    version: 1,
    theme: {
      textColor: '#000000',
      backgroundColor: '#f5f5f5',
    },
  },
];

async function seedStorage(
  page: import('@playwright/test').Page,
  functions: unknown[],
) {
  await page.evaluate(async fns => {
    await chrome.storage.sync.set({functions: fns});
  }, functions);
}

test('popup lists seeded functions and copies via the sandbox', async ({
  context,
  extensionId,
}) => {
  expect(extensionId).toBe(EXTENSION_ID);

  // Seed chrome.storage.sync from an extension-origin page (storage APIs
  // are only available to pages running in the extension's own origin).
  const seeder = await context.newPage();
  await seeder.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(seeder, seedFunctions);
  await seeder.close();

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const functionItem = popup.getByText(seedFunctions[0].name);
  await expect(functionItem).toBeVisible();

  await functionItem.click();

  // On success the FunctionError box (rendered in place of the function
  // name on failure) never appears; on failure the error text would show
  // "ParseError" / "ExecutionError" / "ReturnsEmpty" instead of the name.
  await expect(
    popup.getByText(/ParseError|ExecutionError|ReturnsEmpty/),
  ).toHaveCount(0);
  await expect(functionItem).toBeVisible();

  // Confirm the sandbox round trip actually produced the expected text and
  // that it landed on the clipboard (clipboardWrite permission is granted
  // in the manifest; clipboard-read is granted to the test context so we
  // can verify it here instead of only asserting on the absence of errors).
  //
  // The seeded function joins `title` and `url` of the active tab. In this
  // automation setup the "active tab" ends up being the popup page itself
  // (there's no real browser-action click to focus a separate content
  // tab), so the expected clipboard content is the popup's own title/url
  // rather than some other page's.
  await expect
    .poll(() => popup.evaluate(() => navigator.clipboard.readText()))
    .toBe(`cocopy ${popup.url()}`);
});
