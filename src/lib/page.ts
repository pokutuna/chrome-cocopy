import {getTabContent, getSelectionText} from './tab';

/**
 * Page is the target object for copying.
 */
export interface Page {
  /** title of the page. */
  title: string;

  /** url of the page. */
  url: string;

  /** html of the page */
  content?: string;

  /** selected text when executing the extension. */
  selectingText?: string;
}

export function isPage(input: any): input is Page {
  return (
    typeof input === 'object' &&
    typeof input.title === 'string' &&
    typeof input.url === 'string'
  );
}

export async function createPageTargetFromTab(
  tab: chrome.tabs.Tab
): Promise<Page> {
  // tab.url and tab.title are present when including `activeTab` permission.
  const url = (tab.url || tab.pendingUrl) as string;
  const [content, selectingText] = await Promise.all([
    getTabContent(tab),
    getSelectionText(tab),
  ]);
  return {title: tab.title!, url, selectingText, content};
}
