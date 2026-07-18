import React from 'react';
import {ThemeProvider} from 'styled-components';

import {theme} from '../common/Theme';
import {FunctionList} from './FunctionList';
import {PopupHeader} from './Header';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <PopupHeader />
      <FunctionList />
    </ThemeProvider>
  );
};
