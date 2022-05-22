import React from 'react';
import {ThemeProvider} from 'styled-components';
import {theme} from '../common/Theme';

export const Wrapper = (props: {children?: React.ReactNode}) => {
  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
};
