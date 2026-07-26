import {Routes, Route} from 'react-router-dom';

import {FunctionList} from './FunctionList';
import {Hint, DebuggingHint} from './Hints';
import {InstallFunction} from './InstallFunction';
import {LegacyBackup, LegacyBackupBanner} from './LegacyBackup';
import {Links} from './Links';
import {MainColumn, Title, VersionLabel} from './Parts';

const PageRoot = () => (
  <>
    <FunctionList />
    <LegacyBackupBanner />
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

const PageLegacy = () => (
  <>
    <LegacyBackup />
    <Links />
  </>
);

export const App = () => {
  return (
    <MainColumn>
      <Title />
      <Routes>
        <Route path="/" element={<PageRoot />} />
        <Route path="/install" element={<PageInstall />} />
        <Route path="/legacy" element={<PageLegacy />} />
      </Routes>
      <VersionLabel />
    </MainColumn>
  );
};
