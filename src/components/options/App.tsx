import {h} from 'preact';
import {ThemeProvider} from 'styled-components';

import {HashRouter as Router, Switch, Route} from 'react-router-dom';

import {theme} from '../common/Theme';
import {MainColumn, Title} from './Parts';
import {FunctionList} from './FunctionList';
import {Links} from './Links';
import {Hint, DebuggingHint} from './Hints';
import {InstallFunction} from './InstallFunction';

export const App = () => {
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
              <Links />
            </Route>
            <Route path="/install">
              <InstallFunction />
              <Hint />
              <Links />
            </Route>
          </Switch>
        </MainColumn>
      </ThemeProvider>
    </Router>
  );
};
