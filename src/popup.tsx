import {h, render} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from './components/common/Theme';
import {PopupWrapper} from './components/popup/Parts';
import {PopupHeader} from './components/popup/Header';
import {FunctionList} from './components/popup/FunctionList';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <PopupWrapper>
        <PopupHeader />
        <FunctionList />
      </PopupWrapper>
    </ThemeProvider>
  );
};

render(<App />, document.getElementById('root')!);
