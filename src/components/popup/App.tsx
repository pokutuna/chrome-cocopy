import {h} from 'preact';
import {ThemeProvider} from 'styled-components';

import {theme} from '../common/Theme';
import {PopupWrapper} from './Parts';
import {PopupHeader} from './Header';
import {FunctionList} from './FunctionList';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <PopupWrapper>
        <PopupHeader />
        <FunctionList />
      </PopupWrapper>
    </ThemeProvider>
  );
};
