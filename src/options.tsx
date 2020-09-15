import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from './components/common/Theme';
import {MainColumn, Title} from './components/options/Parts';
import {FunctionList} from './components/options/FunctionList';
import {Links} from './components/options/Links';
import {Hint, DebuggingHint} from './components/options/Hints';

import './components/options/prism.css';
import './components/options/code.css';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainColumn>
        <Title />
        <FunctionList />
        <Hint />
        <DebuggingHint />
        <Links />
      </MainColumn>
    </ThemeProvider>
  );
};

render(<App />, document.getElementById('root')!);
