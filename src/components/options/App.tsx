import {h} from 'preact';
import {ThemeProvider} from 'styled-components';

import {Switch, Route} from 'react-router-dom';

import {theme} from '../common/Theme';
import {MainColumn, Title, VersionLabel} from './Parts';
import {FunctionList} from './FunctionList';
import {Links} from './Links';
import {Hint, DebuggingHint} from './Hints';
import {InstallFunction} from './InstallFunction';

export const App = () => {
  return (
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
        <VersionLabel />
      </MainColumn>
    </ThemeProvider>
  );
};
