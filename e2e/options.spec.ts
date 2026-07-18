import {test, expect} from './fixtures';

async function getStoredFunctionNames(
  page: import('@playwright/test').Page,
): Promise<string[]> {
  return page.evaluate(() => {
    return new Promise<string[]>(resolve => {
      chrome.storage.sync.get({functions: []}, value => {
        const fns = (value.functions || []) as Array<{name: string}>;
        resolve(fns.map(f => f.name));
      });
    });
  });
}

test('adding a function via the options UI persists to chrome.storage.sync', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  // Start from a clean slate so this test doesn't depend on (or get
  // confused by) the built-in default functions.
  await options.evaluate(() => {
    return new Promise<void>(resolve => {
      chrome.storage.sync.set({functions: []}, () => resolve());
    });
  });
  await options.reload();

  const newFunctionName = 'E2E Added Function';

  // Open the "Create New Function" item.
  await options.getByText('Create New Function').click();

  // Fill in the Name field of the newly opened editor.
  const nameInput = options.locator('#name');
  await expect(nameInput).toBeVisible();
  await nameInput.fill(newFunctionName);

  // Save the function. Saving a *new* function collapses the editor
  // immediately (see the `isNew` branch of the 'save' action in
  // src/components/options/FunctionsReducer.ts), so the "Saved" label
  // (which only applies when re-saving an already-existing function) never
  // renders here — assert on the editor closing and the item reappearing
  // in the list instead.
  const saveButton = options.getByRole('button', {name: 'Save'});
  await saveButton.click();
  await expect(saveButton).not.toBeVisible();

  // Verify persistence directly against chrome.storage.sync.
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toContain(newFunctionName);

  // And that it survives a reload (i.e. is actually read back from storage,
  // not just held in in-memory state).
  await options.reload();
  await expect(options.getByText(newFunctionName)).toBeVisible();
});
