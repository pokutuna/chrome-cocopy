import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {HashRouter as Router, Switch, Route} from 'react-router-dom';

import {theme} from './components/common/Theme';
import {MainColumn, Title} from './components/options/Parts';
import {FunctionList} from './components/options/FunctionList';
import {Links} from './components/options/Links';
import {Hint, DebuggingHint} from './components/options/Hints';

import './components/options/prism.css';
import './components/options/code.css';

const App = () => {
  return (
    <Router basename="/">
      <ThemeProvider theme={theme}>
        <MainColumn>
          <Title />
          <Switch>
            <Route exact path="/">
              <FunctionList />
              <Hint />
              <DebuggingHint />
            </Route>
            <Route path="/install">
              <p>hello</p>
            </Route>
          </Switch>
          <Links />
        </MainColumn>
      </ThemeProvider>
    </Router>
  );
};

render(<App />, document.getElementById('root')!);
