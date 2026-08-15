import * as ReactDOM from 'react-dom/client';

import {ConfigProvider} from './components/common/ConfigContext';
import {I18nProvider} from './components/common/I18nContext';
import {App} from './components/popup/App';

import './theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ConfigProvider>,
);
