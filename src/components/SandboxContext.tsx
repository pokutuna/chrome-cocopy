import {h, createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useState, useEffect} from 'preact/hooks';

import {EvaluatePayload} from '../lib/eval';

export type Sender = (message: EvaluatePayload) => void;
export type Receiver = (this: Window, event: MessageEvent) => void;

export interface Sandbox {
  send: Sender;
}

export const SandboxContext = createContext<Sandbox | null>(null);

interface SandboxProviderProps {
  receiver: Receiver;
  children: ComponentChildren;
}

const SandboxProvider = (props: SandboxProviderProps) => {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);

  useEffect(() => {
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    if (sandbox.tagName !== 'IFRAME' || !sandbox.contentWindow) {
      throw new Error('sandbox.contentWindow is falthy');
    }

    setSandbox({
      send: payload => sandbox.contentWindow!.postMessage(payload, '*'),
    });

    window.addEventListener('message', props.receiver);
    return () => window.removeEventListener('message', props.receiver);
  }, []);

  return (
    <SandboxContext.Provider value={sandbox}>
      {props.children}
    </SandboxContext.Provider>
  );
};

export default SandboxProvider;
