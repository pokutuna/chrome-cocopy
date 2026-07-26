import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {CopyFunction} from '../../lib/function';
import {
  LEGACY_BACKUP_KEY,
  LEGACY_FUNCTIONS_KEY,
  MIGRATION_RESULT_KEY,
  MigrationResult,
} from '../../lib/function-store/migration';
import {decodeSharable} from '../../lib/share';
import {LegacyBackup} from './LegacyBackup';
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
  expect(screen.queryByText('Legacy storage backup')).not.toBeInTheDocument();
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
  await screen.findByText('Legacy storage backup');
  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);

  await act(async () => {
    await store.repository.delete('b');
  });

  await waitFor(() =>
    expect(screen.getByRole('button', {name: 'Import'})).toBeInTheDocument(),
  );
  expect(screen.getAllByText('Already in your functions')).toHaveLength(1);
});

test('shows status, timestamp, byte size, count and per-function state', async () => {
  const store = createTestStore();
  const legacy = [fn('a'), fn('b')];
  await seedStore(store, legacy);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({migratedCount: 2}),
  });

  render(renderWithStore(store, <LegacyBackup />));

  await screen.findByText('Legacy storage backup');

  const bytes = new TextEncoder().encode(JSON.stringify(legacy)).length;
  expect(
    screen.getAllByText(`present, ${bytes} bytes, 2 function(s)`),
  ).toHaveLength(2); // legacy (sync) and backup (local)
  expect(screen.getByText('Completed')).toBeInTheDocument();
  expect(screen.getByText('New storage enabled')).toBeInTheDocument();
  expect(
    screen.getByText(new Date('2026-01-02T03:04:05.000Z').toLocaleString()),
  ).toBeInTheDocument();

  expect(screen.getByText('name-a')).toBeInTheDocument();
  expect(screen.getByText('name-b')).toBeInTheDocument();
  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);
  expect(
    screen.queryByRole('button', {name: 'Import'}),
  ).not.toBeInTheDocument();
});

test('a skipped function shows its reason and can be imported without touching the legacy data', async () => {
  const store = createTestStore();
  const migrated = fn('a');
  const skipped = fn('b', {pattern: '(('});
  const legacy = [migrated, skipped];

  await seedStore(store, [migrated]);
  await seedLegacy(store, {
    legacy,
    backup: legacy,
    result: result({
      migratedCount: 1,
      skipped: [{id: 'b', name: 'name-b', reason: 'size'}],
    }),
  });

  // The skip reason recorded by migration ('size') is what the row reports;
  // the function itself still validates, so it stays importable.
  const importable = fn('b');
  await store.local.set({
    [LEGACY_BACKUP_KEY]: JSON.stringify([migrated, importable]),
  });
  await store.sync.set({[LEGACY_FUNCTIONS_KEY]: [migrated, importable]});

  render(renderWithStore(store, <LegacyBackup />));
  await screen.findByText('Legacy storage backup');

  expect(
    screen.getByText('Not migrated: it is too large to store'),
  ).toBeInTheDocument();

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
  // The import mints a fresh id rather than reusing the legacy one.
  expect(ids[1]).not.toBe('b');

  // Both rows now read as imported: 'a' was migrated, 'b' just came in.
  await waitFor(() =>
    expect(screen.getAllByText('Already in your functions')).toHaveLength(2),
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
  await screen.findByText('Legacy storage backup');

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
  await screen.findByText('Legacy storage backup');

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
  await screen.findByText('Legacy storage backup');

  expect(screen.getByText('Failed')).toBeInTheDocument();
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
  await screen.findByText('Legacy storage backup');

  expect(screen.getAllByText('Already in your functions')).toHaveLength(2);
});
