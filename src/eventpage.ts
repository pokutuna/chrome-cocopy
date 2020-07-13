import * as util from './util';

window.addEventListener('message', event => {
  console.log('message on eventpage', event);
  if (event.data.result) util.copyToClipboard(event.data.result);

  new Notification('Error', {
    icon: 'img/icon/128.png',
    body: JSON.stringify(event.data),
  });
});

type WIPInput = {title: string} & chrome.contextMenus.OnClickData;

const copyAsMarkdown = `(target) => {
  if (target.srcUrl && target.linkUrl) {
    return \`[![](\${target.srcUrl})](\${target.linkUrl})\`;
  }
  if (target.srcUrl) {
    return \`![](\${target.srcUrl})\`;
  }
  if (target.linkUrl) {
    return \`[\${target.selectionText}](\${target.linkUrl})\`;
  }
  return \`[\${target.title}](\${target.pageUrl})\`;
};`;

const copyAsScrapbox = `(target) => {
  // TODO handle image
  if (target.linkUrl) {
    return \`[\${target.selectionText} \${target.linkUrl}]\`;
  }
  return \`[\${target.title} \${target.pageUrl}]\`;
};`;

const quote = `(target) => {
  return ">" + [...((target.selectionText || "").split("\\n")), target.pageUrl].join(
    "\\n> "
  );
};`;

const defs = [
  {
    id: '1',
    name: 'Copy as Markdown',
    code: copyAsMarkdown,
    contexts: ['page', 'selection', 'link', 'image'],
  },
  {
    id: '2',
    name: 'Copy as Scrapbox',
    code: copyAsScrapbox,
    contexts: ['page', 'selection', 'link'],
  },
  {
    id: '3',
    name: 'Quote selection',
    code: quote,
    contexts: ['selection'],
  },
];

const onMenuItemClick = (
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
) => {
  console.log(info);
  if (tab) {
    const sandbox = document.getElementById('sandbox') as HTMLIFrameElement;
    if (!sandbox.contentWindow) {
      console.error('sandbox contentwindow is falthy');
      return;
    }
    const item = defs.find(d => d.id === info.menuItemId);
    if (item) {
      console.log(item.code);
      sandbox.contentWindow.postMessage(
        {
          code: item.code,
          targetData: {
            title: tab.title,
            ...info,
          },
        },
        '*'
      );
    }
  }
};

chrome.contextMenus.onClicked.addListener(onMenuItemClick);

const refreshContextMenues = () => {
  // https://developer.chrome.com/extensions/contextMenus#type-ContextType
  const contexts = ['page', 'selection', 'link', 'image'];

  chrome.contextMenus.removeAll();

  // https://developer.chrome.com/extensions/contextMenus#method-create
  chrome.contextMenus.create({
    title: 'COCOPY',
    id: 'root',
    contexts,
  });

  defs.forEach(d => {
    chrome.contextMenus.create({
      parentId: 'root',
      id: d.id,
      title: d.name,
      type: 'normal',
      contexts: d.contexts,
    });
  });
};

chrome.runtime.onInstalled.addListener(refreshContextMenues);
