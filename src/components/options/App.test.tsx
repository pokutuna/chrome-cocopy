import {render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {MemoryRouter} from 'react-router-dom';
import {vi} from 'vitest';

import {defaultFunctions} from '../../lib/builtin';
import {encodeSharable} from '../../lib/share';
import {App} from './App';

test('render options', async () => {
  vi.mocked(chrome.tabs.query).mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[],
  );
  vi.mocked(chrome.storage.sync.get).mockImplementation((_, cb) =>
    cb({functions: defaultFunctions}),
  );
  vi.mocked(chrome.runtime.getManifest).mockImplementation(
    () => ({version_name: 'Build v0.0.0'}) as chrome.runtime.Manifest,
  );

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

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

  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

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

  // Form fields carry the decoded function's values. The labels contain
  // nested elements (hint text/tooltip), so match by input id instead of
  // getByLabelText's exact-text matching.
  expect(document.getElementById('pattern')).toHaveValue(fn.pattern ?? '');
  expect(document.getElementById('code')).toHaveValue(fn.code);
});
