import {h} from 'preact';

import {render, screen, waitFor} from '@testing-library/preact';
import '@testing-library/jest-dom';
import {chrome} from 'jest-chrome';

import {defaultFunctions} from '../../lib/builtin';
import {App} from './App';

test('render options', async () => {
  chrome.tabs.query.mockImplementation((_, cb) =>
    cb([{url: 'https://example.test/page'}] as chrome.tabs.Tab[])
  );
  chrome.storage.sync.get.mockImplementation((_, cb) =>
    cb({functions: defaultFunctions})
  );

  render(<App />);

  await waitFor(() =>
    expect(screen.getByText(defaultFunctions[0].name)).toBeInTheDocument()
  );

  expect(document.body).toMatchSnapshot();
});
