import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from './components/Theme';
import {PopupWrapper} from './components/popup/Parts';
import {PopupHeader} from './components/popup/Header';
import {Functions} from './components/popup/Functions';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <PopupWrapper>
        <PopupHeader />
        <Functions />
      </PopupWrapper>
    </ThemeProvider>
  );
};

render(<App />, document.getElementById('root')!);
