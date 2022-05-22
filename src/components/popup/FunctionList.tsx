import {useState, useEffect, useCallback} from 'react';

import {getCopyFunctions} from '../../lib/config';
import {CopyFunction, filterFunctions} from '../../lib/function';
import {getActiveTab} from '../../lib/tab';
import {createPageTargetFromTab} from '../../lib/page';
import {codeToIndex} from '../../lib/util';
import {EvalResult, EvalError, isRichContent} from '../../lib/eval';
import {useModifier} from './hooks';

import {FunctionItem} from './Function';
import {useEvaluate} from '../common/Sandbox';

type FunctionError = {
  id: string;
  error: EvalError;
} | null;

async function availableFunctions(): Promise<CopyFunction[]> {
  const [tab, fs] = await Promise.all([getActiveTab(), getCopyFunctions()]);
  const url = tab.url || tab.pendingUrl || '';
  return filterFunctions(url, fs);
}

function writeResultToClipboard(res: EvalResult) {
  if (res.result) {
    if (isRichContent(res.result)) {
      navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([res.result.text], {type: 'text/plain'}),
          'text/html': new Blob([res.result.html], {type: 'text/html'}),
        }),
      ]);
    } else {
      navigator.clipboard.writeText(res.result.toString());
    }
  }
}

export const FunctionList = () => {
  const evaluate = useEvaluate();
  const [functions, setFunctions] = useState<CopyFunction[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [fnError, setFnError] = useState<FunctionError>(null);
  const modifier = useModifier();

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
          code: c.code + `\n//# sourceURL=${encodeURI(c.name)}.js`,
          arg: {
            ...(await createPageTargetFromTab(tab)),
            modifier,
          },
        })
          .then(writeResultToClipboard)
          .catch(r => setFnError({id: c.id, error: r.error}));
      };
      run().catch(e => console.error(e));
    },
    [evaluate, modifier]
  );

  // Kyeboard Shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const index = codeToIndex(e.code);
      if (index !== undefined) {
        const rule = functions[index];
        if (rule) onClick(rule);
      }
      if (e.key === 'Esc' || e.key === 'Escape') {
        window.close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [functions, onClick]);

  return (
    <>
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
    </>
  );
};
