import {h, render, Fragment} from 'preact';
import {useState, useEffect, useContext, useCallback} from 'preact/hooks';

import * as util from './lib/util';
import {CopyRule, getCopyRules} from './lib/config';
import SandboxProvider, {SandboxContext} from './components/SandboxContext';
import {createPageTargetFromTab} from './lib/target';

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
    <Fragment>
      <h1>COCOPY!</h1>
      <a href="options.html" target="_blank">
        settings
      </a>
      <SandboxProvider receiver={receiver}>
        <CopyRules />
      </SandboxProvider>
    </Fragment>
  );
};

const CopyRules = () => {
  const [rules, setRules] = useState<CopyRule[]>([]);

  const sandbox = useContext(SandboxContext);

  useEffect(() => {
    getCopyRules().then(setRules);
  }, []);

  const onClick = useCallback(
    (c: CopyRule) => {
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
    <ul>
      {rules.map(r => (
        <li key={r.id} onClick={() => onClick(r)} tabIndex={0}>
          {r.displayName}
        </li>
      ))}
    </ul>
  );
};

render(<App />, document.getElementById('root')!);
