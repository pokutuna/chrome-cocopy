import {h, render} from 'preact';
import {useState, useEffect, useContext, useCallback} from 'preact/hooks';
import {ThemeProvider} from 'styled-components';

import {getCopyFunctions} from './lib/config';
import {createPageTargetFromTab} from './lib/target';
import {CopyFunction, CopyFunctionWithTheme} from './lib/function';
import * as util from './lib/util';

import SandboxProvider, {SandboxContext} from './components/SandboxContext';
import {theme} from './components/Theme';
import {PopupWrapper, PopupHeader} from './components/Popup';
import {FunctionItem} from './components/Function';

const App = () => {
  const receiver = (event: MessageEvent) => {
    if (event.data.result) {
      navigator.clipboard.writeText(event.data.result);
    }
    // TODO collect error and copy rule
    if (event.data.error) {
      console.error(event.data);
      new Notification('Error', {
        icon: 'img/icon/128.png',
        body: JSON.stringify(event.data),
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <PopupWrapper>
        <PopupHeader />
        <SandboxProvider receiver={receiver}>
          <CopyRules />
        </SandboxProvider>
      </PopupWrapper>
    </ThemeProvider>
  );
};

const CopyRules = () => {
  const [rules, setRules] = useState<CopyFunctionWithTheme[]>([]);

  const sandbox = useContext(SandboxContext);

  useEffect(() => {
    getCopyFunctions().then(setRules);
  }, []);

  const onClick = useCallback(
    (c: CopyFunction) => {
      util
        .getActiveTab()
        .then(tab => {
          sandbox &&
            sandbox.send({
              code: c.code,
              target: createPageTargetFromTab(tab),
            });
        })
        .catch(e => console.error(e));
    },
    [sandbox]
  );

  // Kyeboard Shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // index
      if (/^\d$/.test(e.key)) {
        const index = util.keyToIndex(e.key);
        const rule = rules[index];
        if (rule) onClick(rule);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [rules]);

  return (
    <div>
      {rules.map((r, idx) => (
        <FunctionItem key={r.id} fn={r} index={idx} onClick={onClick} />
      ))}
    </div>
  );
};

render(<App />, document.getElementById('root')!);
