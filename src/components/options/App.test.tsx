import {h} from 'preact';

import {render, screen, waitFor} from '@testing-library/preact';
import '@testing-library/jest-dom';
import 'jest-styled-components';
import {chrome} from 'jest-chrome';
import {MemoryRouter} from 'react-router-dom';

import {defaultFunctions} from '../../lib/builtin';
import {App} from './App';
import {encodeSharable} from '../../lib/share';

test('render options', async () => {
  chrome.tabs.query.mockImplementation(
    async () => [{url: 'https://example.test/page'}] as chrome.tabs.Tab[]
  );
  chrome.storage.sync.get.mockImplementation((_, cb) =>
    cb({functions: defaultFunctions})
  );

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument()
  );

  expect(document.body).toMatchSnapshot();
});

test('render install page', async () => {
  const fn = defaultFunctions[0];
  const path = `/install?f=${encodeURIComponent(encodeSharable(fn))}`;

  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Install Function')).toBeInTheDocument();
  });

  expect(screen.getByDisplayValue(fn.name)).toBeInTheDocument();
  expect(
    screen.getByDisplayValue(fn.theme.backgroundColor)
  ).toBeInTheDocument();
  expect(screen.getByText('Install')).toBeInTheDocument();
  expect(screen.getByText('Update URL')).toBeInTheDocument();

  expect(document.body).toMatchSnapshot();
});
