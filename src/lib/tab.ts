export function getActiveTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabs && tabs[0] ? resolve(tabs[0]) : reject(new Error('no active tabs'));
    });
  });
}

function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute short code as a content_script with timeout
 * @param tab
 * @param code js string returns a string
 */
async function executeInTab(
  tab: chrome.tabs.Tab,
  code: string
): Promise<string | undefined> {
  const p = new Promise<string>(resolve => {
    chrome.tabs.executeScript(tab.id!, {code}, results => {
      resolve(results?.[0]);
    });
  });
  const result = await Promise.race([p, timeout(2000)]);
  return typeof result === 'string' ? result : undefined;
}

export async function getTabContent(
  tab: chrome.tabs.Tab
): Promise<string | undefined> {
  return executeInTab(tab, 'document.documentElement.outerHTML');
}

export async function getSelectionText(
  tab: chrome.tabs.Tab
): Promise<string | undefined> {
  return executeInTab(tab, 'window.getSelection().toString()');
}
