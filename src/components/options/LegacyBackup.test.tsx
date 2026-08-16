import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {createConfigStore} from '../../lib/config';
import {CopyFunction} from '../../lib/function';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {
  LEGACY_BACKUP_KEY,
  LEGACY_FUNCTIONS_KEY,
  MIGRATION_RESULT_KEY,
  MigrationResult,
} from '../../lib/function-store/migration';
import {ja} from '../../lib/i18n';
import {decodeSharable} from '../../lib/share';
import {LegacyBackup, LegacyBackupBanner} from './LegacyBackup';
import {
  createTestStore,
  renderWithStore,
  seedStore,
  TestStore,
} from './test-helpers';

function fn(id: string, overrides: Partial<CopyFunction> = {}): CopyFunction {
  return {
    id,
    name: `name-${id}`,
    code: `return "${id}";`,
    version: 1,
    theme: {textColor: '#000000', backgroundColor: '#ffffff'},
    ...overrides,
  };
}

function result(overrides: Partial<MigrationResult> = {}): MigrationResult {
  return {
    formatVersion: 1,
    migratedAt: '2026-01-02T03:04:05.000Z',
    outcome: 'completed',
    legacyExisted: true,
    migratedCount: 0,
    skipped: [],
    renamedIds: [],
    ...overrides,
  };
}

/** Seeds the legacy sync value, the local backup, and the migration result. */
async function seedLegacy(
  store: TestStore,
  options: {
    legacy?: unknown;
    backup?: unknown;
    result?: MigrationResult;
  },
): Promise<void> {
  if ('legacy' in options) {
    await store.sync.set({[LEGACY_FUNCTIONS_KEY]: options.legacy});
  }
  if ('backup' in options) {
    await store.local.set({
      [LEGACY_BACKUP_KEY]: JSON.stringify(options.backup),
    });
  }
  if (options.result) {
    await store.local.set({[MIGRATION_RESULT_KEY]: options.result});
  }
}

async function storedIds(store: TestStore): Promise<string[]> {
  return (await store.repository.list()).map(ref => ref.id);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test('renders nothing on a fresh install', async () => {
  const store = createTestStore();
  const {container} = render(renderWithStore(store, <LegacyBackup />));

  // Let the status read and the follow-up render settle before asserting that
  // nothing at all was drawn.
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByText('Legacy Functions')).not.toBeInTheDocument();
});

test('renders nothing when migration only seeded the default functions', async () => {
  const store = createTestStore();
  await seedStore(store, [fn('default')]);
  // A fresh install records a completed result with legacyExisted: false and
  // leaves no legacy value or backup behind.
  await seedLegacy(store, {
    result: result({legacyExisted: false, migratedCount: 1}),
  });

  const {container} = render(renderWithStore(store, <LegacyBackup />));

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(container).toBeEmptyDOMElement();
});

test('deleting a migrated function re-enables its Import', async () => {
  const store = createTestStore();
  const legacy = [fn('a'), fn('b')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 2}),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  // Entries start collapsed; expand both to see their state.
  fireEvent.click(screen.getByText('name-a'));
  fireEvent.click(screen.getByText('name-b'));
  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);

  await act(async () => {
    await store.repository.delete('b');
  });

  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'Import'})).toBeInTheDocument(),
  );
  expect(screen.getAllByText('Already in your functions')).toHaveLength(1);
});

test('expanding an entry shows its pattern and code without any way to save', async () => {
  const store = createTestStore();
  const legacy = [fn('a', {pattern: 'https://example\\.test/.*'})];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 1}),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-a'));

  // The editor's fields, filled in and copyable but read-only.
  const name = screen.getByDisplayValue('name-a');
  expect(name).toHaveAttribute('readonly');
  expect(screen.getByDisplayValue('#ffffff')).toBeInTheDocument(); // Color
  expect(
    screen.getByDisplayValue('https://example\\.test/.*'),
  ).toBeInTheDocument();

  // The code renders in a read-only CodeMirror surface.
  const code = [...document.querySelectorAll('.cm-line')]
    .map(line => line.textContent ?? '')
    .join('\n');
  expect(code).toBe('return "a";');
  expect(
    document.querySelector('.cm-content')?.getAttribute('contenteditable'),
  ).toBe('false');

  // Viewing only: no way to save or share. Delete is the one mutation offered.
  expect(screen.queryByRole('button', {name: 'Save'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button', {name: 'Share'})).not.toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();

  // Collapses back on a second click.
  fireEvent.click(screen.getByText('name-a'));
  expect(screen.queryByDisplayValue('name-a')).not.toBeInTheDocument();
});

test('shows the entry list with a one-line summary and per-function state', async () => {
  const store = createTestStore();
  const legacy = [fn('a'), fn('b')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 2}),
  });

  render(renderWithStore(store, <LegacyBackup />));

  await screen.findByText('Legacy Functions');

  // Provenance is one line under the export button, not a per-store table.
  const bytes = new TextEncoder().encode(JSON.stringify(legacy)).length;
  const when = new Date('2026-01-02T03:04:05.000Z').toLocaleDateString();
  expect(
    screen.getByText(`migrated ${when} · ${bytes} bytes of original data`),
  ).toBeInTheDocument();

  expect(screen.getByText('name-a')).toBeInTheDocument();
  expect(screen.getByText('name-b')).toBeInTheDocument();

  fireEvent.click(screen.getByText('name-a'));
  fireEvent.click(screen.getByText('name-b'));
  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();
});

test('an entry missing from the catalog can be imported without touching the legacy data', async () => {
  const store = createTestStore();
  const migrated = fn('a');
  // 'b' was migrated but later deleted from the function list, so its row
  // offers Import again.
  const deleted = fn('b');
  const legacy = [migrated, deleted];

  await seedStore(store, [migrated]);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 2}),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-b'));
  expect(screen.getByText('Not migrated')).toBeInTheDocument();

  const before = JSON.stringify(
    (await store.local.get([LEGACY_BACKUP_KEY]))[LEGACY_BACKUP_KEY],
  );
  const legacyBefore = JSON.stringify(
    (await store.sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  );

  fireEvent.click(screen.getByRole('button', {name: 'Import'}));

  await waitFor(async () => expect(await storedIds(store)).toHaveLength(2));

  const ids = await storedIds(store);
  expect(ids[0]).toBe('a');
  // The import reuses the legacy id, which is what marks the row as migrated
  // on later visits without any separate imported-state to persist.
  expect(ids[1]).toBe('b');

  // The expanded row 'b' now reads as imported ('a' stays collapsed).
  await waitFor(() =>
    expect(screen.getAllByText('Already in your functions')).toHaveLength(1),
  );

  // Neither the backup nor the legacy sync value is consumed by an import.
  expect(
    JSON.stringify(
      (await store.local.get([LEGACY_BACKUP_KEY]))[LEGACY_BACKUP_KEY],
    ),
  ).toBe(before);
  expect(
    JSON.stringify(
      (await store.sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
    ),
  ).toBe(legacyBefore);
});

test('an imported entry is still recognized after the page is reopened', async () => {
  const store = createTestStore();
  const legacy = [fn('b')];
  await seedStore(store, []);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 0}),
  });

  const first = render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');
  fireEvent.click(screen.getByText('name-b'));
  fireEvent.click(screen.getByRole('button', {name: 'Import'}));
  await waitFor(async () => expect(await storedIds(store)).toEqual(['b']));
  first.unmount();

  // Reopening the page rebuilds the row state from the catalog alone; the row
  // must not offer Import again, which would create a duplicate.
  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');
  fireEvent.click(screen.getByText('name-b'));

  expect(screen.getByText('Already in your functions')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();
});

test('a function skipped for size cannot be imported as-is and links to the editor', async () => {
  const store = createTestStore();
  const legacy = [fn('b')];
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 0,
      skipped: [{id: 'b', name: 'name-b', reason: 'size'}],
    }),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');
  fireEvent.click(screen.getByText('name-b'));

  // Import as-is would only hit the per-item limit again; recovery goes
  // through the editor, where the user can shrink the code.
  expect(
    screen.getByText('Cannot be imported: it is too large to store'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'Fix in editor'})).toBeInTheDocument();
});

test('a function that fails validation cannot be imported and links to the editor', async () => {
  const store = createTestStore();
  const broken = {...fn('b'), pattern: '(('};
  const legacy = [broken];
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 0,
      skipped: [{id: 'b', name: 'name-b', reason: 'pattern'}],
    }),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-b'));
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Cannot be imported: its URL pattern is not a valid regular expression',
    ),
  ).toBeInTheDocument();

  const link = screen.getByRole('link', {name: 'Fix in editor'});
  expect(link.getAttribute('href')).toMatch(/^\/install\?f=/);
});

test('a function with a broken shape still gets an editor link carrying what is salvageable', async () => {
  const store = createTestStore();
  // No theme and no version: fails the schema outright.
  const legacy = [{id: 'b', name: 'kept name', code: 'return "kept";'}];
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 0,
      skipped: [{id: 'b', name: 'kept name', reason: 'schema'}],
    }),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('kept name'));
  expect(
    screen.getByText('Cannot be imported: does not match the function format'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();

  const link = screen.getByRole('link', {name: 'Fix in editor'});
  const href = link.getAttribute('href') ?? '';
  const encoded = new URLSearchParams(href.slice(href.indexOf('?'))).get('f');
  const decoded = decodeSharable(encoded ?? '');
  expect(decoded?.name).toBe('kept name');
  expect(decoded?.code).toBe('return "kept";');
});

test('deleting an entry removes it from both the backup and the legacy sync value', async () => {
  const store = createTestStore();
  const legacy = [fn('a'), fn('b')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 2}),
  });

  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-a'));
  fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

  expect(confirm).toHaveBeenCalledTimes(1);
  expect(confirm.mock.calls[0][0]).toContain('name-a');

  await waitFor(() =>
    expect(screen.queryByText('name-a')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('name-b')).toBeInTheDocument();

  // The entry is purged from both copies of the legacy data.
  const backupRaw = (await store.local.get([LEGACY_BACKUP_KEY]))[
    LEGACY_BACKUP_KEY
  ] as string;
  expect(JSON.parse(backupRaw)).toEqual([fn('b')]);
  expect(
    (await store.sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  ).toEqual([fn('b')]);

  // Deleting from the legacy data never touches the current functions.
  expect(await storedIds(store)).toEqual(['a', 'b']);
});

test('cancelling the delete confirmation leaves the legacy data intact', async () => {
  const store = createTestStore();
  const legacy = [fn('a')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 1}),
  });

  vi.spyOn(window, 'confirm').mockReturnValue(false);

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-a'));
  fireEvent.click(screen.getByRole('button', {name: 'Delete'}));

  expect(screen.getByText('name-a')).toBeInTheDocument();
  expect(
    (await store.sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  ).toEqual(legacy);
  expect(
    JSON.parse(
      (await store.local.get([LEGACY_BACKUP_KEY]))[LEGACY_BACKUP_KEY] as string,
    ),
  ).toEqual(legacy);
});

test('a failed migration shows the error and can still export', async () => {
  const store = createTestStore();
  const legacy = {not: 'an array'};
  await seedLegacy(store, {
    legacy,
    result: result({
      outcome: 'failed',
      error: 'Legacy function data is not an array; migration cannot proceed.',
    }),
  });

  const createObjectURL = vi.fn((_blob: Blob) => 'blob:legacy');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', {...URL, createObjectURL, revokeObjectURL});

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  expect(
    screen.getByText('migration failed', {exact: false}),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'Legacy function data is not an array; migration cannot proceed.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText('No functions could be read from the legacy data.'),
  ).toBeInTheDocument();

  const button = screen.getByRole('button', {name: 'Export original JSON'});
  expect(button).toBeEnabled();
  fireEvent.click(button);

  expect(createObjectURL).toHaveBeenCalledTimes(1);
  const blob = createObjectURL.mock.calls[0][0];
  expect(await blob.text()).toBe(JSON.stringify(legacy));
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:legacy');

  // Exporting does not touch the stored data.
  expect(
    (await store.sync.get([LEGACY_FUNCTIONS_KEY]))[LEGACY_FUNCTIONS_KEY],
  ).toEqual(legacy);

  vi.unstubAllGlobals();
});

test('banner renders nothing on a fresh install', async () => {
  const store = createTestStore();
  const {container} = render(renderWithStore(store, <LegacyBackupBanner />));

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(container).toBeEmptyDOMElement();
});

test('banner links to the legacy page without rendering the full section', async () => {
  const store = createTestStore();
  const legacy = [fn('a')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 1}),
  });

  render(renderWithStore(store, <LegacyBackupBanner />));

  const link = await screen.findByRole('link', {
    name: 'Legacy Functions',
  });
  expect(link.getAttribute('href')).toBe('/legacy');
  // The banner explains why legacy data exists before pointing at it, and
  // warns that the backup is temporary.
  expect(
    screen.getByText('cocopy now stores functions in a new format', {
      exact: false,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Your previous functions were migrated automatically.', {
      exact: false,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('will be removed in a future update', {exact: false}),
  ).toBeInTheDocument();

  // The inspection UI stays on the legacy page.
  expect(
    screen.queryByRole('button', {name: 'Export original JSON'}),
  ).not.toBeInTheDocument();
});

test('banner reports functions the migration left behind', async () => {
  const store = createTestStore();
  const legacy = [fn('a'), fn('b')];
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 1,
      skipped: [{id: 'b', name: 'name-b', reason: 'size'}],
    }),
  });

  render(renderWithStore(store, <LegacyBackupBanner />));

  await screen.findByRole('link', {name: 'Legacy Functions'});
  expect(
    screen.getByText('1 of your functions could not be carried over.', {
      exact: false,
    }),
  ).toBeInTheDocument();
});

test('banner reports a failed migration', async () => {
  const store = createTestStore();
  await seedLegacy(store, {
    legacy: {not: 'an array'},
    result: result({outcome: 'failed', error: 'broken'}),
  });

  render(renderWithStore(store, <LegacyBackupBanner />));

  await screen.findByRole('link', {name: 'Legacy Functions'});
  expect(
    screen.getByText(
      'The automatic migration failed; your original data is untouched.',
      {exact: false},
    ),
  ).toBeInTheDocument();
});

test('banner renders in Japanese when the stored language is ja', async () => {
  const store = createTestStore();
  const legacy = [fn('a')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 1}),
  });

  const configStore = createConfigStore(new InMemoryKeyValueStorage());
  await configStore.update({language: 'ja'});

  render(renderWithStore(store, <LegacyBackupBanner />, ['/'], configStore));

  expect(
    await screen.findByText(ja.legacyBanner.completed, {exact: false}),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {name: 'Legacy Functions'}),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', {name: 'Legacy Functions'}),
  ).toBeInTheDocument();
});

test('a renamed id counts as already migrated', async () => {
  const store = createTestStore();
  const legacy = [fn('dup'), fn('dup', {name: 'name-dup2'})];
  await seedStore(store, [fn('dup'), fn('renamed', {name: 'name-dup2'})]);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 2,
      renamedIds: [{from: 'dup', to: 'renamed'}],
    }),
  });

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy Functions');

  fireEvent.click(screen.getByText('name-dup'));
  fireEvent.click(screen.getByText('name-dup2'));
  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);
});
