export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (tabs && tabs[0]) return tabs[0];
  throw new Error('no active tabs');
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
  fn: () => void
): Promise<string | undefined> {
  const p = new Promise<string>(resolve => {
    return chrome.scripting.executeScript(
      {target: {tabId: tab.id!}, func: fn},
      results => {
        resolve(results?.[0].result);
      }
    );
  });

  const result = await Promise.race([p, timeout(2000)]);
  return typeof result === 'string' ? result : undefined;
}

export async function getTabContent(
  tab: chrome.tabs.Tab
): Promise<string | undefined> {
  return executeInTab(tab, _getTabContent);
}

function _getTabContent(): string {
  return document.documentElement.outerHTML;
}

export async function getSelectionText(
  tab: chrome.tabs.Tab
): Promise<string | undefined> {
  return executeInTab(tab, _getSelectionText);
}

function _getSelectionText(): string {
  return (window.getSelection() || '').toString();
}
