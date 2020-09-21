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

export async function getTabContent(
  tab: chrome.tabs.Tab
): Promise<string | undefined> {
  const html = new Promise<string>(resolve => {
    chrome.tabs.executeScript(
      tab.id!,
      {
        code: 'document.documentElement.outerHTML',
      },
      results => {
        const result = results?.[0];
        resolve(result);
      }
    );
  });

  const result = await Promise.race([html, timeout(2000)]);
  return typeof result === 'string' ? result : undefined;
}
