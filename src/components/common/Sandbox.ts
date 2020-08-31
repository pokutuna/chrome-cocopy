import {useMemo, useCallback, useEffect, useRef} from 'preact/hooks';
import {EvalPayload, EvalResult} from '../../lib/eval';

type Chan = {channel: number};

interface MessageResponse<T> extends MessageEvent {
  readonly data: T & Chan;
}

let channel = 0;
function nextChannel(): number {
  channel = channel + 1;
  return channel;
}

// reQuest, reSponse
export function useSandbox<Q, S>(onMessage: (s: S) => void) {
  const channel = useMemo(nextChannel, []);
  const sender = useCallback((request: Q) => {
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    if (sandbox.tagName !== 'IFRAME' || !sandbox.contentWindow) {
      throw new Error('sandbox.contentWindow is falthy');
    }
    const withChan = {...request, channel};
    sandbox.contentWindow.postMessage(withChan, '*');
  }, []);

  const receiver = useCallback(
    (message: MessageResponse<S>) => {
      if (message.data?.channel !== channel) {
        throw new Error('invalid message received');
      }
      onMessage(message.data);
    },
    [channel, onMessage]
  );

  useEffect(() => {
    window.addEventListener('message', receiver);
    return () => window.removeEventListener('message', receiver);
  }, [receiver]);

  return sender;
}

/**
 * Providing Promise interface for useSandbox
 */
export function useEvaluate(): (q: EvalPayload) => Promise<EvalResult> {
  const promise = useRef([console.error, console.error]);
  const onMessage = useCallback(
    (s: EvalResult) => {
      const [resolve, reject] = promise.current;
      s.error ? reject(s) : resolve(s);
    },
    [promise]
  );
  const evaluate = useSandbox<EvalPayload, EvalResult>(onMessage);
  return useCallback(
    (q: EvalPayload) => {
      return new Promise((resolve, reject) => {
        promise.current = [resolve, reject];
        evaluate(q);
      });
    },
    [promise, evaluate]
  );
}
