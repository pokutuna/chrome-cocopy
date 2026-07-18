import {Routes, Route} from 'react-router-dom';
import {ThemeProvider} from 'styled-components';

import {theme} from '../common/Theme';
import {FunctionList} from './FunctionList';
import {Hint, DebuggingHint} from './Hints';
import {InstallFunction} from './InstallFunction';
import {Links} from './Links';
import {MainColumn, Title, VersionLabel} from './Parts';

const PageRoot = () => (
  <>
    <FunctionList />
    <Hint />
    <DebuggingHint />
    <Links />
  </>
);

const PageInstall = () => (
  <>
    <InstallFunction />
    <Hint />
    <Links />
  </>
);

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainColumn>
        <Title />
        <Routes>
          <Route path="/" element={<PageRoot />} />
          <Route path="/install" element={<PageInstall />} />
        </Routes>
        <VersionLabel />
      </MainColumn>
    </ThemeProvider>
  );
};
