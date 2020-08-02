import * as target from './target';

describe('createTargetFromContextMenu', () => {
  const tab = {
    title: 'the test page',
    url: 'https://example.test/somepage',
  } as chrome.tabs.Tab;

  test('page', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: false,
      frameId: 0,
      menuItemId: 'menu1',
      pageUrl:
        'https://scrapbox.io/pokutuna/copy_%E3%81%99%E3%82%8B%E6%8B%A1%E5%BC%B5',
      parentMenuItemId: 'root',
    };

    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'page',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      content: '',
    });
  });

  test('image', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: false,
      frameId: 0,
      mediaType: 'image',
      menuItemId: 'menu1',
      pageUrl: 'https://twitter.com/pokutuna',
      parentMenuItemId: 'root',
      srcUrl:
        'https://pbs.twimg.com/profile_images/474556916874506241/pz4cQzhI_400x400.jpeg',
    };
    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'image',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      isLink: false,
      linkText: undefined,
      imageURL:
        'https://pbs.twimg.com/profile_images/474556916874506241/pz4cQzhI_400x400.jpeg',
    });
  });

  test('image with link', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: false,
      frameId: 0,
      linkUrl: 'https://gyazo.com/c5e5bd1d981a9eee85bd21418fa39f7d',
      mediaType: 'image',
      menuItemId: 'menu1',
      pageUrl: 'https://scrapbox.io/pokutuna/pokutuna',
      parentMenuItemId: 'root',
      srcUrl: 'https://gyazo.com/c5e5bd1d981a9eee85bd21418fa39f7d/thumb/1000',
    };
    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'image',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      isLink: true,
      linkURL: 'https://gyazo.com/c5e5bd1d981a9eee85bd21418fa39f7d',
      imageURL: 'https://gyazo.com/c5e5bd1d981a9eee85bd21418fa39f7d/thumb/1000',
    });
  });

  test('text with selection', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: true,
      frameId: 0,
      menuItemId: 'menu1',
      pageUrl:
        'https://scrapbox.io/pokutuna/copy_%E3%81%99%E3%82%8B%E6%8B%A1%E5%BC%B5',
      parentMenuItemId: 'root',
      selectionText: 'copy する拡張',
    };
    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'text',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      text: 'copy する拡張',
      isLink: false,
      linkText: undefined,
      linkURL: undefined,
      isSelection: true,
      selectionText: 'copy する拡張',
    });
  });

  test('text with link', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: false,
      frameId: 0,
      linkUrl: 'https://scrapbox.io/pokutuna/',
      menuItemId: 'menu1',
      pageUrl: 'https://scrapbox.io/pokutuna/pokutuna',
      parentMenuItemId: 'root',
    };
    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'text',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      text: '',
      isLink: true,
      linkURL: 'https://scrapbox.io/pokutuna/',
      linkText: undefined,
      isSelection: false,
      selectionText: undefined,
    });
  });

  test('text with link & selection', () => {
    const data: chrome.contextMenus.OnClickData = {
      editable: false,
      frameId: 0,
      linkUrl: 'http://b.hatena.ne.jp/pokutuna/follower',
      menuItemId: 'menu2',
      pageUrl: 'http://b.hatena.ne.jp/pokutuna/bookmark',
      parentMenuItemId: 'root',
      selectionText: '146 お気に入られ',
    };
    const t = target.createTargetFromContextMenu(data, tab);
    expect(t).toEqual({
      type: 'text',
      title: 'the test page',
      pageURL: 'https://example.test/somepage',
      text: '146 お気に入られ',
      isLink: true,
      linkURL: 'http://b.hatena.ne.jp/pokutuna/follower',
      linkText: undefined,
      isSelection: true,
      selectionText: '146 お気に入られ',
    });
  });
});
