export type TargetType = 'page' | 'text' | 'image';

export type Target = PageTarget | TextTarget | ImageTarget;

interface CommonCopyTarget {
  /** type of the target to copy. */
  type: TargetType;

  /** title of the page executing extension. */
  title: string;

  /** * url ot the page executiong extension. */
  pageURL: string;
}

export interface PageTarget extends CommonCopyTarget {
  type: 'page';
}

interface LinkTarget {
  isLink: boolean;
  linkURL?: string;
  linkText?: string;
}

export interface TextTarget extends CommonCopyTarget, LinkTarget {
  type: 'text';

  /**
   * `text` is selectionText when you selecting any text.
   * Or `text` is the link text.
   */
  text: string;

  isSelection: boolean;
  selectionText?: string;
}

export interface ImageTarget extends CommonCopyTarget, LinkTarget {
  type: 'image';
  imageURL: string;
}

export function isTarget(input: any): input is Target {
  // XXX not checking detailed targets
  return (
    input &&
    typeof input.type === 'string' &&
    typeof input.title === 'string' &&
    typeof input.pageURL === 'string'
  );
}

export function createPageTargetFromTab(tab: chrome.tabs.Tab): PageTarget {
  // tab.url and tab.title are present when including `activeTab` permission.
  const pageURL = (tab.url || tab.pendingUrl) as string;
  return {type: 'page', title: tab.title!, pageURL};
}

/**
 * This method is using from ContextMenu features.
 * I don't using this now.
 * @internal
 */
export function createTargetFromContextMenu(
  data: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab
): Target {
  const title = tab.title! as string;
  const pageURL = (tab.url || tab.pendingUrl) as string;

  if (data.mediaType === 'image') {
    const target: ImageTarget = {
      type: 'image',
      title,
      pageURL,
      imageURL: data.srcUrl!,
      isLink: !!data.linkUrl,
      linkURL: data.linkUrl,
    };
    return target;
  }

  if (data.selectionText || data.linkUrl) {
    // TODO to retrieve its link text, need to communicate with
    // listening "contextmenu" event using content script.
    const linkText = undefined;
    const text = data.selectionText || linkText || '';
    const target: TextTarget = {
      type: 'text',
      title,
      pageURL,
      text,
      isSelection: !!data.selectionText,
      selectionText: data.selectionText,
      isLink: !!data.linkUrl,
      linkURL: data.linkUrl,
      linkText,
    };
    return target;
  }

  return {
    type: 'page',
    title,
    pageURL,
  };
}
