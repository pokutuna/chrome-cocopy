const onMenuItemClick = (
  info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab | undefined
) => {
  console.log(info);
  console.log(tab);
};

const refreshContextMenues = () => {
  const contexts = ["page", "selection", "link", "image", "video", "audio"];

  chrome.contextMenus.removeAll();

  // https://developer.chrome.com/extensions/contextMenus#method-create
  chrome.contextMenus.create({
    title: "COCOPY",
    id: "root",
    contexts: ["all"]
  });

  ["menu1", "menu2"].forEach(m => {
    chrome.contextMenus.create({
      parentId: "root",
      title: m,
      type: "normal",
      id: m,
      contexts: ["all"]
    });
  });
};

chrome.runtime.onInstalled.addListener(refreshContextMenues);
chrome.contextMenus.onClicked.addListener(onMenuItemClick);
