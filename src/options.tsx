import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from './components/Theme';
import {MainColumn, Title} from './components/options/Parts';
import {Functions} from './components/options/Functions';
import {Links} from './components/options/Links';

import './components/options/prism.css';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainColumn>
        <Title />
        <Functions />
        <Links />
      </MainColumn>
    </ThemeProvider>
  );
};

render(<App />, document.getElementById('root')!);
