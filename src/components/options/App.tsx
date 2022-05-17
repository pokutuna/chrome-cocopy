import {ThemeProvider} from 'styled-components';
import {Routes, Route} from 'react-router-dom';

import {theme} from '../common/Theme';
import {MainColumn, Title, VersionLabel} from './Parts';
import {FunctionList} from './FunctionList';
import {Links} from './Links';
import {Hint, DebuggingHint} from './Hints';
import {InstallFunction} from './InstallFunction';

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
