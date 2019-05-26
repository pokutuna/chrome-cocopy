const onDOMContentLoaded = new Promise(resolve => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => resolve());
  } else {
    resolve();
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    let fn: () => string;
    try {
      fn = eval(message.code);
      if (typeof fn !== "function") throw new Error("Must be a function");
    } catch (e) {
      sendResponse({ error: e.message, errorType: "ParseError" });
      return;
    }

    onDOMContentLoaded.then(() => {
      let result: any;
      try {
        result = fn();
      } catch (e) {
        sendResponse({ error: e.message, errorType: "ExecutionError" });
      }
      sendResponse({ result });
    });
    return true;
  }
);
