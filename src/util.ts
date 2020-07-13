export const copyToClipboard = (text: string) => {
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.selectionStart = 0;
  temp.selectionEnd = temp.value.length;

  const s = temp.style;
  s.position = 'fixed';
  s.left = '-100%';

  document.body.appendChild(temp);
  temp.focus();
  document.execCommand('copy');
  temp.blur();
  document.body.removeChild(temp);
};

export const getActiveTab = (): Promise<chrome.tabs.Tab> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      tabs && tabs[0] ? resolve(tabs[0]) : reject();
    });
  });
};
