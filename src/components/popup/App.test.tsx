import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi, test, expect, afterEach} from 'vitest';

import {ConfigStore, createConfigStore} from '../../lib/config';
import {FunctionStore} from '../../lib/function-store';
import {
  ACTIVE_POINTER_KEY,
  functionDocumentKey,
} from '../../lib/function-store/keys';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {createLegacyBackupRepository} from '../../lib/function-store/migration';
import {createFunctionRepository} from '../../lib/function-store/repository';
import {
  makeFunction,
  seedSnapshot,
} from '../../lib/function-store/repository.test-helpers';
import {ConfigProvider, ConfigStoreProvider} from '../common/ConfigContext';
import {FunctionStoreProvider} from '../common/FunctionStoreContext';
import {I18nProvider} from '../common/I18nContext';
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

function buildConfigStore(): ConfigStore {
  return createConfigStore(new InMemoryKeyValueStorage());
}

function renderApp(
  store: FunctionStore,
  configStore: ConfigStore = buildConfigStore(),
) {
  return render(
    <ConfigStoreProvider value={configStore}>
      <FunctionStoreProvider value={store}>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </FunctionStoreProvider>
    </ConfigStoreProvider>,
  );
}

const clipboardWriteTextMock = vi.fn().mockResolvedValue(undefined);
const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('navigator', {
  ...navigator,
  // jsdom's navigator keeps its properties on the prototype, so the spread
  // above copies none of them; detectLanguage() needs language explicitly.
  language: 'en-US',
  clipboard: {
    writeText: clipboardWriteTextMock,
    write: clipboardWriteMock,
  },
});

afterEach(() => {
  evaluateMock.mockReset();
  clipboardWriteTextMock.mockClear();
  clipboardWriteMock.mockClear();
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

test('a newer storage format shows an update prompt instead of a blank popup', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const {store, storage} = buildStore();
  await seedSnapshot(storage, [makeFunction('a')]);
  await storage.set({[ACTIVE_POINTER_KEY]: {formatVersion: 2, catalogId: 'c'}});

  renderApp(store);

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Update the extension'),
  );
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

test('closeAfterCopy=true closes the popup after the clipboard write completes', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () =>
      [{id: 1, url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => []);
  evaluateMock.mockResolvedValue({result: 'copied!'});
  const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

  const fn = makeFunction('runnable', {name: 'Run me'});
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [fn]);
  const configStore = buildConfigStore();
  await configStore.update({closeAfterCopy: true});

  renderApp(store, configStore);

  await waitFor(() => expect(screen.getByText(fn.name)).toBeInTheDocument());
  fireEvent.click(screen.getByText(fn.name));

  await waitFor(() => expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1));
  // The clipboard write resolves well within the 300ms running animation;
  // the popup must stay open until the animation finishes.
  expect(closeSpy).not.toHaveBeenCalled();
  await waitFor(() => expect(closeSpy).toHaveBeenCalledTimes(1));

  // The clipboard write must complete before the popup closes.
  expect(clipboardWriteTextMock.mock.invocationCallOrder[0]).toBeLessThan(
    closeSpy.mock.invocationCallOrder[0],
  );

  closeSpy.mockRestore();
});

test('closeAfterCopy=false (default) does not close the popup after copying', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () =>
      [{id: 1, url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => []);
  evaluateMock.mockResolvedValue({result: 'copied!'});
  const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

  const fn = makeFunction('runnable', {name: 'Run me'});
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [fn]);

  renderApp(store);

  await waitFor(() => expect(screen.getByText(fn.name)).toBeInTheDocument());
  fireEvent.click(screen.getByText(fn.name));

  await waitFor(() => expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1));
  expect(closeSpy).not.toHaveBeenCalled();

  closeSpy.mockRestore();
});

test('closeAfterCopy=true does not close the popup when the function errors', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () =>
      [{id: 1, url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );
  vi.mocked(chrome.scripting.executeScript).mockImplementation(async () => []);
  evaluateMock.mockRejectedValue({
    error: {type: 'ExecutionError', name: 'Error', message: 'boom'},
  });
  const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});

  const fn = makeFunction('runnable', {name: 'Run me'});
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [fn]);
  const configStore = buildConfigStore();
  await configStore.update({closeAfterCopy: true});

  renderApp(store, configStore);

  await waitFor(() => expect(screen.getByText(fn.name)).toBeInTheDocument());
  fireEvent.click(screen.getByText(fn.name));

  await waitFor(() => expect(evaluateMock).toHaveBeenCalledTimes(1));
  expect(closeSpy).not.toHaveBeenCalled();
  expect(clipboardWriteTextMock).not.toHaveBeenCalled();

  closeSpy.mockRestore();
});

test('renders in Japanese when the stored language is ja', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const {store} = buildStore();
  const configStore = buildConfigStore();
  await configStore.update({language: 'ja'});

  render(
    <ConfigStoreProvider value={configStore}>
      <FunctionStoreProvider value={store}>
        <ConfigProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </ConfigProvider>
      </FunctionStoreProvider>
    </ConfigStoreProvider>,
  );

  expect(await screen.findByLabelText('設定')).toBeInTheDocument();
});

test('popup startup reads the config from storage only once', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  const fn = makeFunction('runnable', {name: 'Run me'});
  const {store, storage} = buildStore();
  await seedSnapshot(storage, [fn]);

  const configStorage = new InMemoryKeyValueStorage();
  const getSpy = vi.spyOn(configStorage, 'get');
  const configStore = createConfigStore(configStorage);

  render(
    <ConfigStoreProvider value={configStore}>
      <FunctionStoreProvider value={store}>
        <ConfigProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </ConfigProvider>
      </FunctionStoreProvider>
    </ConfigStoreProvider>,
  );

  // Settle the popup first: a second read would happen while it is still
  // mounting consumers.
  await waitFor(() => expect(screen.getByText(fn.name)).toBeInTheDocument());
  await waitFor(() => expect(getSpy).toHaveBeenCalled());
  expect(getSpy).toHaveBeenCalledTimes(1);
});
