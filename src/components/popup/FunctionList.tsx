import {useState, useEffect, useEffectEvent, useCallback, useRef} from 'react';

import {DEFAULT_CONFIG} from '../../lib/config';
import {EvalResult, EvalError, isRichContent} from '../../lib/eval';
import {
  CopyFunctionRef,
  UnsupportedVersionError,
} from '../../lib/function-store/types';
import {createPageTargetFromTab} from '../../lib/page';
import {timeIt} from '../../lib/perf-debug';
import {getActiveTab} from '../../lib/tab';
import {codeToIndex} from '../../lib/util';
import {useConfigStore} from '../common/ConfigContext';
import {useFunctionRepository} from '../common/FunctionStoreContext';
import {useEvaluate} from '../common/Sandbox';
import {ListError} from './Error';
import {FunctionItem} from './Function';
import {useModifier} from './hooks';

type FunctionError = {
  id: string;
  error: EvalError;
} | null;

// Must match animation-duration of `.running` in Function.module.css: the
// popup stays open (even with closeAfterCopy) until the indicator finishes.
const RUNNING_ANIMATION_MS = 300;

/** Resolves once the clipboard write settles (or immediately, if there was
 * nothing to copy), so callers can wait for it before closing the popup:
 * window.close() can otherwise abort an in-flight clipboard write. */
function writeResultToClipboard(res: EvalResult): Promise<void> {
  if (res.result) {
    if (isRichContent(res.result)) {
      return navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([res.result.text], {type: 'text/plain'}),
          'text/html': new Blob([res.result.html], {type: 'text/html'}),
        }),
      ]);
    } else {
      return navigator.clipboard.writeText(res.result.toString());
    }
  }
  return Promise.resolve();
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
    typeof (r as {error?: unknown}).error === 'object' &&
    (r as {error?: unknown}).error !== null
  );
}

export const FunctionList = () => {
  const evaluate = useEvaluate();
  const repository = useFunctionRepository();
  const configStore = useConfigStore();
  const [functions, setFunctions] = useState<CopyFunctionRef[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [fnError, setFnError] = useState<FunctionError>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const modifier = useModifier();

  // The running indicator is cleared by a timer; clear it on unmount so it
  // never fires setState after the popup is gone (and a rapid second click
  // does not get its indicator wiped by the first click's timer).
  const runningTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(runningTimer.current), []);

  useEffect(() => {
    const run = async () => {
      const tab = await timeIt('getActiveTab', getActiveTab());
      const url = tab.url || tab.pendingUrl || '';
      return timeIt('listForUrl', repository.listForUrl(url));
    };
    timeIt('FunctionList total', run())
      .then(setFunctions)
      .catch((e: unknown) => {
        console.error(e);
        setListError(
          e instanceof UnsupportedVersionError
            ? 'Your functions were saved by a newer version of cocopy. Update the extension.'
            : 'Failed to load functions.',
        );
      });
  }, [repository]);

  useEffect(() => {
    configStore.read().then(setConfig);
  }, [configStore]);

  const onClick = useCallback(
    (ref: CopyFunctionRef) => {
      setRunning(ref.id);
      clearTimeout(runningTimer.current);
      // Resolves when the running indicator finishes. Never resolves if a
      // rapid second click replaces the timer, but then that click's own
      // flow takes over closing the popup.
      const animationDone = new Promise<void>(resolve => {
        runningTimer.current = setTimeout(() => {
          setRunning(null);
          resolve();
        }, RUNNING_ANIMATION_MS);
      });

      const run = async () => {
        const [tab, fn] = await Promise.all([
          getActiveTab(),
          repository.get(ref).catch(e => {
            throw loadError(e);
          }),
        ]);
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
        .then(async res => {
          await writeResultToClipboard(res);
          if (config.closeAfterCopy) {
            await animationDone;
            window.close();
          }
        })
        .catch((r: unknown) =>
          setFnError({
            id: ref.id,
            error: isEvalRejection(r) ? r.error : loadError(r).error,
          }),
        );
    },
    [config, evaluate, modifier, repository],
  );

  // Kyeboard Shortcut
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
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
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {listError && <ListError message={listError} />}
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
