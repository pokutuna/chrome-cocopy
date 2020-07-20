import {h} from 'preact';
import {useMemo, useCallback, useEffect} from 'preact/hooks';

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
    const withChan = {...request, channel};
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    sandbox?.contentWindow?.postMessage(withChan, '*');
  }, []);

  const receiver = useCallback(
    (message: MessageResponse<S>) => {
      if (message.data.channel !== channel) return;
      onMessage(message.data);
    },
    [onMessage]
  );

  useEffect(() => {
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    if (sandbox.tagName !== 'IFRAME' || !sandbox.contentWindow) {
      throw new Error('sandbox.contentWindow is falthy');
    }
    window.addEventListener('message', receiver);
    return () => window.removeEventListener('message', receiver);
  }, [receiver]);

  return sender;
}
