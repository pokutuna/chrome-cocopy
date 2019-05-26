console.log("sandbox");
const onDOMContentLoaded = new Promise(resolve => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => resolve());
  } else {
    resolve();
  }
});

window.addEventListener("message", (event: MessageEvent) => {
  console.log("message in sandbox", event);
  const sendResponse = (data: EvaluateResponse) => {
    if (!event.source || !event.origin) return;
    (event.source as Window).postMessage(data, event.origin);
  };

  let fn: () => string;
  try {
    fn = eval(event.data.code);
    if (typeof fn !== "function") throw new Error("Must be a function");
  } catch (e) {
    sendResponse({
      error: {
        message: e.message,
        type: "ParseError"
      }
    });
    return;
  }

  onDOMContentLoaded.then(() => {
    let result: any;
    try {
      result = fn();
    } catch (e) {
      sendResponse({
        error: {
          message: e.message,
          type: "ExecutionError"
        }
      });
    }
    sendResponse({ result });
  });
});
