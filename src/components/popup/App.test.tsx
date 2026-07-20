import {render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {vi} from 'vitest';

import {defaultFunctions} from '../../lib/builtin';
import {App} from './App';

test('render popup', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.storage.sync.get).mockImplementation(async () => ({
    functions: defaultFunctions,
  }));
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  render(<App />);

  await waitFor(() =>
    expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument(),
  );

  // Both configured functions are listed with their keyboard shortcut number.
  expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument();
  expect(screen.getByText(defaultFunctions[1].name)).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();

  // Options link in the header.
  expect(screen.getByRole('link')).toHaveAttribute('href', '/options.html');
});
