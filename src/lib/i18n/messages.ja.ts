import type {Messages} from './messages.en';

export const ja = {
  settings: {
    closeAfterCopy: 'コピー後にポップアップを閉じる',
    language: '言語',
    languageAuto: '自動',
  },
  popup: {
    openSettings: '設定',
    loadFailed: '関数の読み込みに失敗しました。',
    unsupportedVersion:
      '関数はより新しいバージョンの cocopy で保存されています。拡張機能を更新してください。',
    functionMissing:
      'この関数を読み込めませんでした。削除された可能性があります。',
  },
  functionList: {
    conflict:
      '関数が別のウィンドウで変更されたため、一覧を再読み込みしました。変更内容を確認してから、もう一度保存してください。',
    quota: '同期ストレージの空き容量が不足していて保存できません。',
    operationFailed: '操作に失敗しました。もう一度お試しください。',
    functionGone: 'この関数は保存されていません。一覧を再読み込みしました。',
    confirmDelete: 'この関数を削除しますか?',
    confirmDiscard: '変更を破棄しますか?',
    createNew: '新しい関数を作成',
    createNewAria: '新しい関数を作成',
    expandAria: '関数を開く',
    collapseAria: '関数を閉じる',
  },
  editor: {
    name: '名前',
    nameEmpty: '入力してください。',
    color: '色',
    randomColorAria: 'ランダムな色を選ぶ',
    pattern: 'URL パターン',
    patternNote: '(任意) URL がマッチしたときにこの関数を表示します。',
    code: 'コード',
    codeNote: '単一の関数である必要があります。',
    save: '保存',
    saving: '保存中...',
    saved: '保存しました',
    install: 'インストール',
    cancel: 'キャンセル',
    delete: '削除',
    share: '共有',
    updateUrl: 'URL を更新',
  },
  hints: {
    singleFunction:
      'コードは、コピーする文字列を返す単一の関数である必要があります。',
    richText:
      'この形式を返すとリッチテキストとプレーンテキストとしてコピーします。このインターフェースは今後変更される可能性があります。',
    mustache: 'mustache テンプレートを描画できます。',
    domParser: 'ページ内容を解析して document として扱えます。',
    throwError:
      'エラーを通知するにはこれを使います。エラーは発生した関数の位置に表示されます。',
    sandbox:
      'コードはページ上ではなく、隔離された sandbox 内で安全に実行されます。',
    gallery: '新しい関数やサンプルコードはギャラリーで探せます:',
    debugInspect:
      'ポップアップを右クリックして「Inspect」(検証) を選ぶと開発者コンソールを開けます。',
    debugSources: '実行後、コードは "Sources" パネルの次の場所に表示されます:',
    debugStatement: 'コード中に書いて使うこともできます。',
  },
  install: {
    noticeShare:
      'この URL を共有すると、他の人がこの関数を使えるようになります。',
    noticeEdit: 'インストール前にコードやその他の項目を編集できます。',
    broken: 'この URL は壊れています。',
  },
  legacyBanner: {
    lead: 'cocopy は拡張機能のストレージ容量制限に対応するため、関数を新しい形式で保存するようになりました。元のデータは復元用に保持されており、今後の更新で削除されます。',
    failed: '自動移行に失敗しました。元のデータはそのまま残っています。',
    skipped: (count: number) => `${count} 件の関数を引き継げませんでした。`,
    completed: '以前の関数は自動的に移行されました。',
    review: 'データの確認と復元は次のページから行えます:',
  },
} satisfies Messages;
