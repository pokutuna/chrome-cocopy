import React, {useState, useEffect, useContext, useCallback} from 'react';
import ReactDOM from 'react-dom';

import * as util from './util';
import {CopyRule, getCopyRules} from './config';
import SandboxProvider, {SandboxContext} from './components/SandboxContext';

const App = () => {
  const receiver = (event: MessageEvent) => {
    if (event.data.result) util.copyToClipboard(event.data.result);
    if (event.data.error) {
      new Notification('Error', {
        icon: 'img/icon/128.png',
        body: JSON.stringify(event.data),
      });
    }
  };

  return (
    <>
      <h1>COCOPY!</h1>
      <a href="options.html" target="_blank">
        options
      </a>
      <SandboxProvider receiver={receiver}>
        <CopyRules />
      </SandboxProvider>
    </>
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
      util.getActiveTab().then(tab => {
        sandbox &&
          sandbox.sender({
            code: c.code,
            targetData: {title: tab.title, pageUrl: tab.url},
          });
      });
    },
    [sandbox]
  );

  return (
    <ul>
      {rules.map(r => (
        <li key={r.id} onClick={() => onClick(r)}>
          {r.displayName}
        </li>
      ))}
    </ul>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
