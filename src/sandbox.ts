const onDOMContentLoaded = new Promise(resolve => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => resolve());
  } else {
    resolve();
  }
});

window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data) return;

  const sendResponse = (data: EvaluateResponse) => {
    if (!event.source || !event.origin) return;
    (event.source as Window).postMessage(data, event.origin);
  };

  let fn: Function;
  try {
    fn = eval(event.data.code);
  } catch (e) {
    sendResponse({
      error: {
        message: e.message,
        type: 'ParseError',
      },
    });
    return;
  }

  onDOMContentLoaded.then(() => {
    let result: any;
    try {
      result = fn.call(undefined, event.data.targetData);
    } catch (e) {
      sendResponse({
        error: {
          message: e.message,
          type: 'ExecutionError',
        },
      });
    }
    sendResponse({result});
  });
});
