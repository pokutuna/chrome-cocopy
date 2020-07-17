import {h, createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useState, useEffect} from 'preact/hooks';

export type Sender = (message: any) => any; // TODO add message type
export type Receiver = (this: Window, event: MessageEvent) => any;

export interface SandboxValue {
  sender: Sender;
}

export const SandboxContext = createContext<SandboxValue | null>(null);

interface SandboxProviderProps {
  receiver: Receiver;
  children: ComponentChildren;
}

const SandboxProvider = (props: SandboxProviderProps) => {
  const [sandbox, setSandbox] = useState<SandboxValue | null>(null);

  useEffect(() => {
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    if (!sandbox.contentWindow) {
      console.error('sandbox.contentWindow is falthy');
      return;
    }

    setSandbox({
      sender: (message: any) =>
        sandbox.contentWindow!.postMessage(message, '*'),
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
