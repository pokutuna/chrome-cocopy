import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';

import {CONFIG_KEY, createConfigStore} from '../../lib/config';
import {InMemoryKeyValueStorage} from '../../lib/function-store/memory-storage';
import {ConfigStoreProvider} from '../common/ConfigContext';
import {Settings} from './Settings';

function renderSettings(storage: InMemoryKeyValueStorage) {
  const configStore = createConfigStore(storage);
  return render(
    <ConfigStoreProvider value={configStore}>
      <Settings />
    </ConfigStoreProvider>,
  );
}

async function readConfig(storage: InMemoryKeyValueStorage): Promise<unknown> {
  return (await storage.get([CONFIG_KEY]))[CONFIG_KEY];
}

test('renders unchecked when storage is empty', async () => {
  const storage = new InMemoryKeyValueStorage();
  renderSettings(storage);

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Close the popup after copying',
  });
  expect(checkbox).not.toBeChecked();
});

test('renders checked when storage has closeAfterCopy: true', async () => {
  const storage = new InMemoryKeyValueStorage();
  await storage.set({[CONFIG_KEY]: {closeAfterCopy: true}});
  renderSettings(storage);

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Close the popup after copying',
  });
  await waitFor(() => expect(checkbox).toBeChecked());
});

test('clicking the checkbox writes closeAfterCopy: true to storage', async () => {
  const storage = new InMemoryKeyValueStorage();
  renderSettings(storage);

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Close the popup after copying',
  });
  expect(checkbox).not.toBeChecked();

  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();

  await waitFor(async () => {
    expect(await readConfig(storage)).toMatchObject({closeAfterCopy: true});
  });
});

test('reflects an external storage change via subscribe', async () => {
  const storage = new InMemoryKeyValueStorage();
  renderSettings(storage);

  const checkbox = await screen.findByRole('checkbox', {
    name: 'Close the popup after copying',
  });
  expect(checkbox).not.toBeChecked();

  // Simulates a change made from another context (e.g. another options
  // window), bypassing this component's own update().
  await act(async () => {
    await storage.set({[CONFIG_KEY]: {closeAfterCopy: true}});
  });

  await waitFor(() => expect(checkbox).toBeChecked());
});
