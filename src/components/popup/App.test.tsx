import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi, test, expect, afterEach} from 'vitest';

import {FunctionStore} from '../../lib/function-store';
import {functionDocumentKey} from '../../lib/function-store/keys';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {createLegacyBackupRepository} from '../../lib/function-store/migration';
import {createFunctionRepository} from '../../lib/function-store/repository';
import {
  makeFunction,
  seedSnapshot,
} from '../../lib/function-store/repository.test-helpers';
import {FunctionStoreProvider} from '../common/FunctionStoreContext';
import {App} from './App';

const {evaluateMock} = vi.hoisted(() => ({evaluateMock: vi.fn()}));

vi.mock('../common/Sandbox', () => ({
  useEvaluate: () => evaluateMock,
}));

function buildStore(): {
  store: FunctionStore;
  storage: InMemoryKeyValueStorage;
} {
  const storage = new InMemoryKeyValueStorage();
  const local = new InMemoryKeyValueStorage();
  const repository = createFunctionRepository({storage, cache: local});
  const legacyBackup = createLegacyBackupRepository({sync: storage, local});
  return {store: {repository, legacyBackup}, storage};
}

function renderApp(store: FunctionStore) {
  return render(
    <FunctionStoreProvider value={store}>
      <App />
    </FunctionStoreProvider>,
  );
}

afterEach(() => {
  evaluateMock.mockReset();
});

test('lists only functions whose pattern matches the active tab URL, in Catalog order', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const matching = makeFunction('match', {
    name: 'Matches example.test',
    pattern: 'example\\.test',
  });
  const nonMatching = makeFunction('no-match', {
    name: 'Only other.test',
    pattern: 'other\\.test',
  });
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [matching, nonMatching]);

  renderApp(store);

  await waitFor(() =>
    expect(screen.getByText(matching.name)).toBeInTheDocument(),
  );

  expect(screen.getByText(matching.name)).toBeInTheDocument();
  expect(screen.queryByText(nonMatching.name)).not.toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  // Only one entry matched, so no second shortcut is rendered.
  expect(screen.queryByText('2')).not.toBeInTheDocument();

  // Options link in the header.
  expect(screen.getByRole('link')).toHaveAttribute('href', '/options.html');
});

test('clicking a function reads its code via repository.get and runs it in the sandbox', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () =>
      [{id: 1, url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => []);
  evaluateMock.mockResolvedValue({result: 'copied!'});

  const fn = makeFunction('runnable', {name: 'Run me'});
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [fn]);

  renderApp(store);

  await waitFor(() => expect(screen.getByText(fn.name)).toBeInTheDocument());
  fireEvent.click(screen.getByText(fn.name));

  await waitFor(() => expect(evaluateMock).toHaveBeenCalledTimes(1));
  const payload = evaluateMock.mock.calls[0][0];
  expect(payload.command).toBe('eval');
  expect(payload.code).toContain(fn.code);
});

test('a document that fails to load shows an error but keeps other functions usable', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () =>
      [{id: 1, url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => []);
  evaluateMock.mockResolvedValue({result: 'copied!'});

  const broken = makeFunction('broken', {name: 'Broken fn'});
  const healthy = makeFunction('healthy', {name: 'Healthy fn'});
  const {store, storage} = buildStore();
  // Seed the catalog with both entries (documentIds seed-doc-1/seed-doc-2 per
  // repository.test-helpers's seedSnapshot default), then delete broken's
  // Function Document so repository.get('broken') resolves to undefined
  // (document gone) while the catalog entry itself remains.
  await seedSnapshot(storage, [broken, healthy]);
  await storage.remove([functionDocumentKey('seed-doc-1')]);

  renderApp(store);

  await waitFor(() =>
    expect(screen.getByText(healthy.name)).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText(broken.name));

  // The broken function shows an error instead of its name; evaluate is never
  // called for it because repository.get failed first.
  await waitFor(() => expect(screen.queryByText(broken.name)).toBeNull());
  expect(evaluateMock).not.toHaveBeenCalled();

  // The healthy function is still selectable and runs normally.
  fireEvent.click(screen.getByText(healthy.name));
  await waitFor(() => expect(evaluateMock).toHaveBeenCalledTimes(1));
});
