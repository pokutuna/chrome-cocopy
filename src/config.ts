export type Type = "page";

export interface CopyRule {
  id: string;
  displayName: string;
  types: Type[];
  code: string;
  pattern?: string;
  enabled: boolean;
  // theme
  //   favicon?
  //   color?
  // version
}

const simplifyAmazon = `
(target) => {
  const match = target.pageUrl.match(/(\\/dp\\/\\w+)[/?]?/)
  return match
    ? new URL(target.pageUrl).origin + match[1]
    : target.pageUrl;
}
`.trim();

const defaultRules: CopyRule[] = [
  {
    id: "default-1",
    displayName: "Markdown: [title](url)",
    types: ["page"],
    code: "(target) => `[${target.title}](${target.pageUrl})`",
    enabled: true
  },
  {
    id: "default-2",
    displayName: "Scrapbox: [title url]",
    types: ["page"],
    code: "(target) => `[${target.title} ${target.pageUrl}`]",
    enabled: true
  },
  {
    id: "default-3",
    displayName: "Amazon.co.jp: simple url",
    types: ["page"],
    code: simplifyAmazon,
    pattern: "amazon.co.jp.+/dp/", // TODO
    enabled: true
  }
];

export const getCopyRules = (): Promise<CopyRule[]> => {
  return new Promise(resolve => {
    chrome.storage.sync.get({ rules: defaultRules }, (value: any) => {
      Array.isArray(value.rules) ? resolve(value.rules) : resolve([]);
    });
  });
};

export const setCopyRules = (rules: CopyRule[]): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.sync.set({ rules }, resolve);
  });
};
