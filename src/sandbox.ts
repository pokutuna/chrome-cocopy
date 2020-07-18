/**
 * Sandbox is for to eval user codes in Chrome Extensions.
 * {@link https://developer.chrome.com/apps/sandboxingEval}
 *
 * @packageDocumentation
 */

import {EvaluateResponse, isCopyRequest} from './lib/eval';

const onDOMContentLoaded = new Promise(resolve => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => resolve());
  } else {
    resolve();
  }
});

window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data) return;
  if (!isCopyRequest(event.data)) return;

  const sendResponse = (res: EvaluateResponse) => {
    if (!event.source || !event.origin) return;
    (event.source as Window).postMessage(res, event.origin);
  };

  let fn: Function;
  try {
    fn = eval(event.data.code);
  } catch (e) {
    sendResponse({
      result: null,
      error: {
        type: 'ParseError',
        message: e.message,
      },
    });
    return;
  }

  onDOMContentLoaded.then(() => {
    let result: any;
    try {
      result = fn.call(undefined, event.data.target);
    } catch (e) {
      sendResponse({
        result: null,
        error: {
          type: 'ExecutionError',
          message: e.message,
        },
      });
    }
    sendResponse({result});
  });
});
