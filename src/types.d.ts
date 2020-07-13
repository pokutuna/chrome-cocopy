interface EvaluateRequest {
  code: string;
}

interface EvaluateResponse {
  result?: string;
  error?: {
    type: string;
    message: string;
  };
}

type OnClickData = chrome.contextMenus.OnClickData;
type MenuPageData = Pick<OnClickData, 'pageUrl'>;
type MenuSelectionData = Pick<OnClickData, 'pageUrl' | 'selectionText'>;
type MenuLinkData = Pick<OnClickData, 'pageUrl' | 'linkUrl'>;
type MenuImageData = Pick<OnClickData, 'pageUrl' | 'srcUrl'>;
