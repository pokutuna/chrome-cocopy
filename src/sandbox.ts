/**
 * Sandbox is for to eval user codes in Chrome Extensions.
 * {@link https://developer.chrome.com/apps/sandboxingEval}
 *
 * @packageDocumentation
 */

import {isEvaluatePayload, evaluate} from './lib/eval';
import * as library from './lib/library';

Object.assign(window, library);

const doneDOMContentLoaded = new Promise(resolve => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => resolve());
  } else {
    resolve();
  }
});

window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data) return;
  if (!isEvaluatePayload(event.data)) return;

  doneDOMContentLoaded.then(async () => {
    const result = await evaluate(event.data);
    if (!event.source || !event.origin) return;
    (event.source as Window).postMessage(result, event.origin);
  });
});
