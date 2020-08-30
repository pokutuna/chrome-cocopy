import {h} from 'preact';
import {useState, useEffect, useCallback} from 'preact/hooks';

import {getCopyFunctions} from '../../lib/config';
import {createPageTargetFromTab} from '../../lib/target';
import {
  CopyFunction,
  CopyFunctionWithTheme,
  filterFunctions,
} from '../../lib/function';
import {getActiveTab, keyToIndex} from '../../lib/util';
import {EvaluateResult} from '../../lib/eval';

import {FunctionItem} from './Function';
import {useEvaluate} from '../common/Sandbox';

type EvaluateError = {
  id: string;
  error: EvaluateResult['error'];
} | null;

async function availableFunctions(): Promise<CopyFunctionWithTheme[]> {
  const [tab, fs] = await Promise.all([getActiveTab(), getCopyFunctions()]);
  const url = tab.url || tab.pendingUrl || '';
  return filterFunctions('page', url, fs);
}

function writeClipbaord(res: EvaluateResult) {
  if (res.result) {
    navigator.clipboard.writeText(res.result.toString());
  }
}

export const FunctionList = () => {
  const evaluate = useEvaluate();
  const [functions, setFunctions] = useState<CopyFunctionWithTheme[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<EvaluateError>(null);

  useEffect(() => {
    availableFunctions().then(setFunctions);
  }, [setFunctions]);

  const onClick = useCallback(
    (c: CopyFunction) => {
      // XXX fix canceling animation when other function running.
      setRunning(c.id);
      setTimeout(() => setRunning(null), 300);

      const run = async () => {
        const tab = await getActiveTab();
        evaluate({
          command: 'eval',
          code: c.code,
          target: await createPageTargetFromTab(tab),
        })
          .then(writeClipbaord)
          .catch(r => setEvalError({id: c.id, error: r.error}));
      };
      run().catch(e => console.error(e));
    },
    [evaluate]
  );

  // Kyeboard Shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        const index = keyToIndex(e.key);
        const rule = functions[index];
        if (rule) onClick(rule);
      }
      if (e.key === 'Esc' || e.key === 'Escape') {
        window.close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [functions]);

  return (
    <div>
      {functions.map((r, idx) => (
        <FunctionItem
          key={r.id}
          running={r.id === running}
          fn={r}
          index={idx}
          onClick={onClick}
        />
      ))}
    </div>
  );
};
