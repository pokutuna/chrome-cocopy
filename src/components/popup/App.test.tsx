import {h} from 'preact';
import render from 'preact-render-to-string';

import {App} from './App';

test('render popup', () => {
  expect(render(<App />, {}, {pretty: true})).toMatchSnapshot();
});
