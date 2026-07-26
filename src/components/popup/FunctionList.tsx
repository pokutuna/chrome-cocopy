import {useState, useEffect, useCallback} from 'react';

import {EvalResult, EvalError, isRichContent} from '../../lib/eval';
import {CopyFunctionRef} from '../../lib/function-store/types';
import {createPageTargetFromTab} from '../../lib/page';
import {getActiveTab} from '../../lib/tab';
import {codeToIndex} from '../../lib/util';
import {useFunctionRepository} from '../common/FunctionStoreContext';
import {useEvaluate} from '../common/Sandbox';
import {FunctionItem} from './Function';
import {useModifier} from './hooks';

type FunctionError = {
  id: string;
  error: EvalError;
} | null;

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

/** Shown when `repository.get` returns undefined (document gone) or throws
 * (e.g. CorruptionError): the function itself could not be loaded, as
 * opposed to an EvalError raised while running its code. Wrapped in
 * `{error}` so it matches the shape `evaluate()` rejects with. */
function loadError(cause?: unknown): {error: EvalError} {
  return {
    error: {
      type: 'ExecutionError',
      name: cause instanceof Error ? cause.name : 'Error',
      message:
        cause instanceof Error
          ? cause.message
          : 'This function could not be loaded. It may have been deleted.',
    },
  };
}

function isEvalRejection(r: unknown): r is {error: EvalError} {
  return (
    typeof r === 'object' &&
    r !== null &&
    'error' in r &&
    typeof (r as {error?: unknown}).error === 'object'
  );
}

export const FunctionList = () => {
  const evaluate = useEvaluate();
  const repository = useFunctionRepository();
  const [functions, setFunctions] = useState<CopyFunctionRef[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [fnError, setFnError] = useState<FunctionError>(null);
  const modifier = useModifier();

  useEffect(() => {
    const run = async () => {
      const tab = await getActiveTab();
      const url = tab.url || tab.pendingUrl || '';
      return repository.listForUrl(url);
    };
    run()
      .then(setFunctions)
      .catch(e => console.error(e));
  }, [repository]);

  const onClick = useCallback(
    (ref: CopyFunctionRef) => {
      setRunning(ref.id);
      setTimeout(() => setRunning(null), 300);

      const run = async () => {
        const tab = await getActiveTab();
        const fn = await repository.get(ref).catch(e => {
          throw loadError(e);
        });
        if (!fn) throw loadError();

        return evaluate({
          command: 'eval',
          code: fn.code + `\n//# sourceURL=${encodeURI(fn.name)}.js`,
          arg: {
            ...(await createPageTargetFromTab(tab)),
            modifier,
          },
        });
      };
      run()
        .then(writeResultToClipboard)
        .catch((r: unknown) =>
          setFnError({
            id: ref.id,
            error: isEvalRejection(r) ? r.error : loadError(r).error,
          }),
        );
    },
    [evaluate, modifier, repository],
  );

  // Kyeboard Shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const index = codeToIndex(e.code);
      if (index !== undefined) {
        const rule = functions[index];
        e.preventDefault();
        if (rule) onClick(rule);
      }
      if (e.key === 'Esc' || e.key === 'Escape') {
        e.preventDefault();
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
