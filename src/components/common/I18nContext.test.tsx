import {act, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {afterEach, expect, test, vi} from 'vitest';

import {CONFIG_KEY, ConfigStore, createConfigStore} from '../../lib/config';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {en, ja} from '../../lib/i18n';
import {ConfigProvider, ConfigStoreProvider} from './ConfigContext';
import {I18nProvider, useT} from './I18nContext';

const EN_TEXT = en.settings.closeAfterCopy;
const JA_TEXT = ja.settings.closeAfterCopy;

function Probe() {
  const t = useT();
  return <span>{t.settings.closeAfterCopy}</span>;
}

function renderProbe(configStore: ConfigStore) {
  return render(
    <ConfigStoreProvider value={configStore}>
      <ConfigProvider>
        <I18nProvider>
          <Probe />
        </I18nProvider>
      </ConfigProvider>
    </ConfigStoreProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('useT outside the provider returns the English catalog', () => {
  render(<Probe />);
  expect(screen.getByText(EN_TEXT)).toBeInTheDocument();
});

test('renders in Japanese when the stored language is ja', async () => {
  vi.stubGlobal('navigator', {language: 'en-US'});
  const storage = new InMemoryKeyValueStorage();
  await storage.set({[CONFIG_KEY]: {language: 'ja'}});
  renderProbe(createConfigStore(storage));

  expect(await screen.findByText(JA_TEXT)).toBeInTheDocument();
});

test('first paint uses the detected language, then the explicit setting replaces it', async () => {
  vi.stubGlobal('navigator', {language: 'ja-JP'});
  const storage = new InMemoryKeyValueStorage();
  await storage.set({[CONFIG_KEY]: {language: 'en'}});
  renderProbe(createConfigStore(storage));

  // Synchronously after render the async read() has not resolved yet: the
  // browser language is shown without waiting for storage.
  expect(screen.getByText(JA_TEXT)).toBeInTheDocument();
  expect(await screen.findByText(EN_TEXT)).toBeInTheDocument();
});

test('auto keeps following the browser language after read() resolves', async () => {
  vi.stubGlobal('navigator', {language: 'ja'});
  const storage = new InMemoryKeyValueStorage();
  const configStore = createConfigStore(storage);
  renderProbe(configStore);

  expect(screen.getByText(JA_TEXT)).toBeInTheDocument();
  // Flush the pending read(); the detected language must survive it.
  await act(async () => {
    await configStore.read();
  });
  expect(screen.getByText(JA_TEXT)).toBeInTheDocument();
});

test('switches when the stored language changes, via subscribe', async () => {
  vi.stubGlobal('navigator', {language: 'en-US'});
  const storage = new InMemoryKeyValueStorage();
  const configStore = createConfigStore(storage);
  renderProbe(configStore);

  expect(screen.getByText(EN_TEXT)).toBeInTheDocument();
  await act(async () => {
    await configStore.update({language: 'ja'});
  });
  expect(await screen.findByText(JA_TEXT)).toBeInTheDocument();
});
