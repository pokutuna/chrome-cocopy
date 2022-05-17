import React from 'react';
import {ThemeProvider} from 'styled-components';

import {theme} from '../common/Theme';
import {PopupHeader} from './Header';
import {FunctionList} from './FunctionList';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <PopupHeader />
      <FunctionList />
    </ThemeProvider>
  );
};
