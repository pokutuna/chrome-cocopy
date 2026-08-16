import type {Messages} from './messages.en';

export const ja = {
  settings: {
    closeAfterCopy: 'コピー後にポップアップを閉じる',
    language: 'Language / 言語',
    languageAuto: '自動',
  },
  popup: {
    openSettings: '設定',
    loadFailed: '関数の読み込みに失敗しました',
    unsupportedVersion:
      'より新しいバージョンの cocopy で保存された関数があります。拡張機能を更新してください',
    functionMissing:
      'この関数を読み込めませんでした。削除された可能性があります',
  },
  functionList: {
    conflict:
      '別のウィンドウで関数が変更されたため、一覧を再読み込みしました。変更内容を確認し、もう一度保存してください',
    quota: '同期ストレージの空き容量が不足しているため、保存できません',
    operationFailed: '操作に失敗しました。もう一度お試しください',
    functionGone: 'この関数は見つかりません。一覧を再読み込みしました',
    confirmDelete: 'この関数を削除しますか?',
    confirmDiscard: '変更を破棄しますか?',
    createNew: '新しい関数を追加',
    createNewAria: '新しい関数を追加',
    expandAria: '関数の編集フォームを開く',
    collapseAria: '関数の編集フォームを閉じる',
  },
  editor: {
    name: '名前',
    nameEmpty: '名前を入力してください',
    color: '色',
    randomColorAria: 'ランダムな色を選択',
    pattern: 'URL パターン',
    patternNote:
      '(省略可) 閲覧中の URL が一致したときだけポップアップに表示します',
    code: 'コード',
    codeNote: '関数は 1 つだけ',
    save: '保存',
    saving: '保存中…',
    saved: '保存しました',
    install: 'インストール',
    cancel: 'キャンセル',
    delete: '削除',
    share: '共有',
    updateUrl: 'URL を更新',
  },
  hints: {
    singleFunction:
      'コードには、コピーする文字列を返す関数を 1 つだけ記述してください',
    richText:
      'この形式の値を返すと、リッチテキストとプレーンテキストの両方でコピーされます。この形式は今後変更される可能性があります',
    mustache: 'Mustache テンプレートをレンダリングできます',
    domParser: 'ページの内容を解析し、検索できる Document に変換します',
    throwError:
      'エラーを通知するには、これを使います。エラーは発生元の関数に表示されます',
    sandbox:
      'コードはページ上ではなく、隔離された sandbox で安全に実行されます',
    gallery: '新しい関数やサンプルコードは、次のギャラリーで探せます:',
    debugInspect:
      'ポップアップを右クリックし、「Inspect (検証)」を選択すると、開発者ツールが開きます',
    debugSources:
      '実行したコードは、「Sources」パネルの次の場所に表示されます:',
    debugStatement: 'コードにこの文を追加することもできます',
  },
  install: {
    noticeShare: 'この URL を共有すると、他のユーザーもこの関数を使えます',
    noticeEdit: 'インストール前に、コードや各項目を編集できます',
    broken: 'この URL は無効です',
  },
  legacyBanner: {
    lead: 'cocopy は、拡張機能のストレージ容量制限に対応するため、関数を新しい形式で保存するようになりました。元のデータは復元用に保持されていますが、今後のアップデートで削除されます',
    failed: '自動移行に失敗しました。元のデータは変更されていません',
    skipped: (count: number) => `${count} 件の関数を移行できませんでした`,
    completed: '既存の関数は自動的に移行されました',
    review: 'データの確認と復元は、次のページから行えます:',
  },
} satisfies Messages;
