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

async function seedStorage(
  page: import('@playwright/test').Page,
  functions: unknown[],
) {
  await page.evaluate(fns => {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.sync.set({functions: fns}, () => {
        if (chrome.runtime.lastError) {
          // chrome.runtime.lastError is a plain {message} object, not an
          // Error; wrap it so page.evaluate's serialization keeps the message.
          reject(
            new Error(
              chrome.runtime.lastError.message ??
                'chrome.storage.sync.set failed',
            ),
          );
          return;
        }
        resolve();
      });
    });
  }, functions);
}

// Minimal CopyFunction fixtures matching src/lib/function.ts's CopyFunction
// shape / src/lib/function.schema.ts. `pattern` is intentionally omitted.
const threeFunctions = [
  {
    id: 'e2e-fn-a',
    name: 'E2E Function A',
    code: '() => "a"',
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#eeeeee'},
  },
  {
    id: 'e2e-fn-b',
    name: 'E2E Function B',
    code: '() => "b"',
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#dddddd'},
  },
  {
    id: 'e2e-fn-c',
    name: 'E2E Function C',
    code: '() => "c"',
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#cccccc'},
  },
];

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

test('editing a function via the options UI persists the changes', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, [threeFunctions[1]]);
  await options.reload();

  await options.getByText('E2E Function B').click();

  const nameInput = options.locator('#name');
  const saveButton = options.getByRole('button', {name: 'Save'});
  await expect(nameInput).toHaveValue('E2E Function B');
  await nameInput.fill('E2E Function B edited');
  await saveButton.click();

  // Existing functions keep the editor open after saving and change the
  // button label to "Saved".
  await expect(saveButton).toHaveText('Saved');
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(['E2E Function B edited']);

  await options.reload();
  await expect(options.getByText('E2E Function B edited')).toBeVisible();
  await expect(
    options.getByText('E2E Function B', {exact: true}),
  ).not.toBeVisible();
});

test('disables saving when the function name is empty', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, [threeFunctions[1]]);
  await options.reload();
  await options.getByText('E2E Function B').click();

  const saveButton = options.getByRole('button', {name: 'Save'});
  await options.locator('#name').fill('');

  await expect(options.getByText('Cannot be empty.')).toBeVisible();
  await expect(saveButton).toBeDisabled();
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(['E2E Function B']);
});

test('disables saving when the URL pattern is invalid', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, [threeFunctions[1]]);
  await options.reload();
  await options.getByText('E2E Function B').click();

  const saveButton = options.getByRole('button', {name: 'Save'});
  await options.locator('#pattern').fill('[');

  await expect(options.getByText(/Invalid regular expression/)).toBeVisible();
  await expect(saveButton).toBeDisabled();
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(['E2E Function B']);
});

test('disables saving when the function code has a syntax error', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, [threeFunctions[1]]);
  await options.reload();
  await options.getByText('E2E Function B').click();

  const saveButton = options.getByRole('button', {name: 'Save'});
  await options.locator('#code').fill('}');

  // Code parsing is debounced and performed by the sandbox iframe, so wait
  // for the returned syntax error before checking the disabled state.
  await expect(options.getByText(/Unexpected token/)).toBeVisible();
  await expect(saveButton).toBeDisabled();
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(['E2E Function B']);
});

test('deleting a function via the options UI removes it from chrome.storage.sync', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, threeFunctions);
  await options.reload();

  await expect(options.getByText('E2E Function A')).toBeVisible();
  await expect(options.getByText('E2E Function B')).toBeVisible();
  await expect(options.getByText('E2E Function C')).toBeVisible();

  // Deleting shows a native `confirm()` dialog (see the 'delete' action in
  // src/components/options/FunctionsReducer.ts) — accept it.
  options.on('dialog', dialog => dialog.accept());

  // Open the editor for "E2E Function B" and click its Delete button.
  await options.getByText('E2E Function B').click();
  const deleteButton = options.getByRole('button', {name: /Delete/});
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // The item disappears from the UI...
  await expect(options.getByText('E2E Function B')).not.toBeVisible();
  await expect(options.getByText('E2E Function A')).toBeVisible();
  await expect(options.getByText('E2E Function C')).toBeVisible();

  // ...and chrome.storage.sync no longer contains it.
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(['E2E Function A', 'E2E Function C']);

  // Survives a reload (i.e. actually persisted, not just in-memory state).
  await options.reload();
  await expect(options.getByText('E2E Function B')).not.toBeVisible();
  await expect(options.getByText('E2E Function A')).toBeVisible();
  await expect(options.getByText('E2E Function C')).toBeVisible();
});

test('reordering functions via drag & drop persists the new order to chrome.storage.sync', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await seedStorage(options, threeFunctions);
  await options.reload();

  await expect(options.getByText('E2E Function A')).toBeVisible();
  await expect(options.getByText('E2E Function B')).toBeVisible();
  await expect(options.getByText('E2E Function C')).toBeVisible();

  // Reordering uses react-dnd's HTML5Backend (see
  // src/components/options/DnD.tsx / FunctionList.tsx). Playwright's
  // `locator.dragTo()` performs real mouse down/move/up sequences via CDP,
  // which Chromium translates into native HTML5 drag events, so it works
  // here without any manual dataTransfer wiring.
  //
  // Each function row renders a "drag knob" (the faBars icon) as the drag
  // handle (see DragKnob in FunctionList.tsx); grab it via the icon rather
  // than styled-components' generated class names, which aren't stable
  // selectors. Rows render in storage order (seeded as A, B, C above), so
  // knob index N corresponds to the Nth seeded function.
  const dragKnobs = options.locator('svg[data-icon="bars"] >> xpath=..');

  // Drag "E2E Function A" (index 0) down past "E2E Function C" (index 2).
  // react-dnd's hover-based reorder swaps step by step as the dragged item
  // crosses each sibling, ending with A placed after C: [B, C, A].
  await dragKnobs.nth(0).dragTo(dragKnobs.nth(2));

  const expectedOrder = ['E2E Function B', 'E2E Function C', 'E2E Function A'];

  // UI reflects the new order immediately (client-side reducer state)...
  const nameLocator = options.locator(
    ':text-is("E2E Function A"), :text-is("E2E Function B"), :text-is("E2E Function C")',
  );
  await expect(nameLocator).toHaveText(expectedOrder);

  // ...and the reordered array is persisted to chrome.storage.sync on drop
  // (see the 'dropped' action in FunctionsReducer.ts).
  await expect
    .poll(() => getStoredFunctionNames(options))
    .toEqual(expectedOrder);

  // Survives a reload.
  await options.reload();
  await expect(nameLocator).toHaveText(expectedOrder);
});
