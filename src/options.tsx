import React from 'react';
import * as ReactDOM from 'react-dom/client';
import {HashRouter as Router} from 'react-router-dom';
import {App} from './components/options/App';

import './components/options/prism.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Router basename="/">
    <App />
  </Router>
);
