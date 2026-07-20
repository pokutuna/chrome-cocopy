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
  fn: () => string,
): Promise<string | undefined> {
  if (tab.id === undefined) return undefined;

  const result = await Promise.race([
    chrome.scripting
      .executeScript({target: {tabId: tab.id}, func: fn})
      .then(results => results?.[0]?.result)
      .catch(() => undefined),
    timeout(2000).then(() => undefined),
  ]);
  return typeof result === 'string' ? result : undefined;
}

export async function getTabContent(
  tab: chrome.tabs.Tab,
): Promise<string | undefined> {
  return executeInTab(tab, _getTabContent);
}

function _getTabContent(): string {
  return document.documentElement.outerHTML;
}

export async function getSelectionText(
  tab: chrome.tabs.Tab,
): Promise<string | undefined> {
  return executeInTab(tab, _getSelectionText);
}

function _getSelectionText(): string {
  return (window.getSelection() || '').toString();
}
