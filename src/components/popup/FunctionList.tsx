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
import {EvalResult, EvalError} from '../../lib/eval';

import {FunctionItem} from './Function';
import {useEvaluate} from '../common/Sandbox';

type FunctionError = {
  id: string;
  error: EvalError;
} | null;

async function availableFunctions(): Promise<CopyFunctionWithTheme[]> {
  const [tab, fs] = await Promise.all([getActiveTab(), getCopyFunctions()]);
  const url = tab.url || tab.pendingUrl || '';
  // return filterFunctions('page', url, fs);
  return fs;
}

function writeResultToClipboard(res: EvalResult) {
  if (res.result) {
    navigator.clipboard.writeText(res.result.toString());
  }
}

export const FunctionList = () => {
  const evaluate = useEvaluate();
  const [functions, setFunctions] = useState<CopyFunctionWithTheme[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [fnError, setFnError] = useState<FunctionError>(null);

  useEffect(() => {
    availableFunctions().then(setFunctions);
  }, [setFunctions]);

  const onClick = useCallback(
    (c: CopyFunction) => {
      setRunning(c.id);
      setTimeout(() => setRunning(null), 300);

      const run = async () => {
        const tab = await getActiveTab();
        evaluate({
          command: 'eval',
          code: c.code,
          target: await createPageTargetFromTab(tab),
        })
          .then(writeResultToClipboard)
          .catch(r => setFnError({id: c.id, error: r.error}));
      };
      run().catch(e => console.error(e));
    },
    [evaluate, setRunning, setFnError]
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
          fn={r}
          index={idx}
          running={r.id === running}
          error={r.id === fnError?.id ? fnError.error : undefined}
          onClick={onClick}
        />
      ))}
    </div>
  );
};
