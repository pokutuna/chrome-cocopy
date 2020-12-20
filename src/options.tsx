import {h, render} from 'preact';

import {HashRouter as Router} from 'react-router-dom';
import {App} from './components/options/App';

import './components/options/prism.css';

render(
  <Router basename="/">
    <App />
  </Router>,
  document.getElementById('root')!
);
