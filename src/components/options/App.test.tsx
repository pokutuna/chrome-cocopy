import {render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {defaultFunctions} from '../../lib/builtin';
import {
  LEGACY_BACKUP_KEY,
  MIGRATION_RESULT_KEY,
} from '../../lib/function-store/migration';
import {encodeSharable} from '../../lib/share';
import {App} from './App';
import {createTestStore, renderWithStore, seedStore} from './test-helpers';

test('render options', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const store = createTestStore();
  await seedStore(store, defaultFunctions);

  render(renderWithStore(store, <App />));

  await waitFor(() =>
    expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument(),
  );

  // Function list: name and shortcut/type text for each configured function.
  expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument();
  expect(screen.getByText(defaultFunctions[1].name)).toBeInTheDocument();
  expect(screen.getByText('Create New Function')).toBeInTheDocument();

  // Section headings.
  expect(screen.getByText('Functions')).toBeInTheDocument();
  expect(screen.getByText('Hints')).toBeInTheDocument();
  expect(screen.getByText('Debugging')).toBeInTheDocument();
  expect(screen.getByText('Links')).toBeInTheDocument();

  // Footer version, populated from the mocked chrome.runtime.getManifest.
  expect(screen.getByText('Build v0.0.0')).toBeInTheDocument();

  // Footer links.
  expect(screen.getByRole('link', {name: 'Chrome Web Store'})).toHaveAttribute(
    'href',
    'https://chrome.google.com/webstore/detail/cocopy/ihnfodlbkhgjnbheemjhkjfkfglgbdgc',
  );
  expect(screen.getByRole('link', {name: 'GitHub Repository'})).toHaveAttribute(
    'href',
    'https://github.com/pokutuna/chrome-cocopy',
  );
});

test('render install page', async () => {
  const fn = defaultFunctions[0];
  const path = `/install?f=${encodeURIComponent(encodeSharable(fn))}`;

  const store = createTestStore();
  render(renderWithStore(store, <App />, [path]));

  await waitFor(() => {
    expect(screen.getByText('Install Function')).toBeInTheDocument();
  });

  expect(screen.getByDisplayValue(fn.name)).toBeInTheDocument();
  expect(
    screen.getByDisplayValue(fn.theme.backgroundColor),
  ).toBeInTheDocument();
  expect(screen.getByText('Install')).toBeInTheDocument();
  expect(screen.getByText('Update URL')).toBeInTheDocument();

  // Install page preamble.
  expect(
    screen.getByText('Sharing this URL makes others can use this function.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'You can edit the code and every fields before installation.',
    ),
  ).toBeInTheDocument();

  // Form fields carry the decoded function's values. The code editor is a
  // contenteditable CodeMirror surface rather than a native textarea.
  expect(document.getElementById('pattern')).toHaveValue(fn.pattern ?? '');
  const code = [...document.querySelectorAll('#code .cm-line')]
    .map(line => line.textContent ?? '')
    .join('\n');
  expect(code).toBe(fn.code);
});

test('render legacy page', async () => {
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const store = createTestStore();
  const legacy = [defaultFunctions[0]];
  await seedStore(store, legacy);
  await store.local.set({
    [LEGACY_BACKUP_KEY]: JSON.stringify(legacy),
    [MIGRATION_RESULT_KEY]: {
      formatVersion: 1,
      migratedAt: '2026-01-02T03:04:05.000Z',
      outcome: 'completed',
      legacyExisted: true,
      migratedCount: 1,
      skipped: [],
      renamedIds: [],
    },
  });

  render(renderWithStore(store, <App />, ['/legacy']));

  await waitFor(() =>
    expect(screen.getByText('Legacy storage backup')).toBeInTheDocument(),
  );

  // The full inspection UI renders on its own page, not the function list.
  expect(
    screen.getByRole('button', {name: 'Export original JSON'}),
  ).toBeInTheDocument();
  expect(screen.queryByText('Create New Function')).not.toBeInTheDocument();
  expect(screen.getByText('Links')).toBeInTheDocument();
});
