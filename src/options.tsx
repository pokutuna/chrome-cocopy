import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from './components/Theme';
import {MainColumn, Title} from './components/options/Parts';
import {Editor} from './components/options/Editor';
import {Links} from './components/options/Links';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainColumn>
        <Title />
        <Editor />
        <Links />
      </MainColumn>
    </ThemeProvider>
  );
};

render(<App />, document.getElementById('root')!);
