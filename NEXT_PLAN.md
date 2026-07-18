# NEXT_PLAN.md — cocopy モダナイズ計画

最終目標:

- 長期メンテできる状態にする(ツールチェイン・依存ライブラリの若返り)
- 機能追加・バグ修正(関数が多くなっても壊れない、利用ライブラリの置き換え)
- Chrome 以外のブラウザ対応(Firefox, Safari。sandbox の仕組みから見直す)

前提: [WXT.md](./WXT.md) の調査結論により **WXT は導入しない**。
cocopy の規模(popup / options / sandbox の 3 entry、content script 無し)なら
Vite + 薄い自前 manifest ジェネレータで十分であり、「脱出が容易で薄い」条件に最も合う。
Firefox/Edge へ本格展開 + ストア提出の CI 自動化までやりたくなった時点で WXT を再検討する。

## Phase 0: 安全網の整備(最初にやる) — **完了 (2026-07-18)**

移行作業全体の保険として、ツール入れ替えの前に E2E を整備する。

実装済み: `e2e/fixtures.ts` (build/ を一時 dir にコピーし manifest に `key` を注入して
extension ID を固定、headless chromium にロード) + `e2e/popup.spec.ts` (storage seed →
関数クリック → sandbox 評価 → クリップボード内容まで検証) + `e2e/options.spec.ts`
(UI から関数追加 → storage.sync 永続化 + reload 後の表示を検証)。`yarn e2e` で実行
(`pree2e` が build を挟む)。

既知の制約: Playwright は popup を「ただのページ」として開くため `activeTab` の
権限付与が発火しない。E2E 用の一時 manifest にのみ `host_permissions: <all_urls>` と
`tabs` を足して回避している (src/manifest.json は無変更)。popup テストの「アクティブ
タブ」は popup 自身になる点に注意。

- Playwright で拡張を実際に Chrome にロードする E2E を用意する
  - 対象は挙動を守りたいコアパス:
    1. popup を開いて関数一覧が表示され、クリックでコピー結果が得られる(sandbox プロトコル経由の評価)
    2. options で関数を追加・編集・保存し、storage に永続化される
  - 本数は最小限(1〜3 本)。移行中も常に green を保つ
- 既存 Jest テストの棚卸し: snapshot 依存のもの、jest-chrome / jest-styled-components 依存のものを把握しておく(Phase 1-2 の移行コスト見積りに使う)

## Phase 1: ビルド・開発ツール最新化

依存関係の都合で Vite → Vitest の順。lint/format は独立していていつでもよい。

### 1-0. Yarn (classic) → pnpm — **完了 (2026-07-18)**

依存の入れ替えが本格化する前、Phase 1 の最初にやる (ロックファイル切り替えの衝突を避ける)。

実施済み: pnpm@10.12.2 (`packageManager` で固定)。`pnpm import` でバージョン維持のまま
lock 切り替え、`resolutions` → `pnpm.overrides`、scripts/husky/CI/docs の yarn 参照を更新。
幽霊依存は無し。唯一のハマりどころは jest の `transformIgnorePatterns` が pnpm の
`.pnpm` ネスト構造で効かなくなる件で、除外パターンに `\.pnpm` を追加して解決
(Vitest 移行時にこの設定ごと消える予定)。

- `pnpm import` で yarn.lock から pnpm-lock.yaml を生成し、バージョンを維持したまま切り替える
- `package.json` の `packageManager` フィールドで pnpm のバージョンを固定 (corepack)
- `resolutions` → pnpm の `overrides` に書き換え
- scripts 内の `yarn build` 等の自己参照 (`pree2e`, `zip`) を `pnpm run` に更新
- husky / lint-staged の動作確認、CI (GitHub Actions) の install ステップ更新
- 厳密な node_modules で幽霊依存が顕在化する可能性 → エラーが出た依存は明示的に追加

### 1-1. Webpack → Vite

- popup / options / sandbox を `rollupOptions.input` に列挙する MPA ビルド
- manifest は手書きテンプレ + 50〜100 行のジェネレータ
  (version 注入、将来のブラウザ分岐用のフック)
- `@crxjs/vite-plugin` はメンテが不安定なので使わない
- zip 化は既存の `yarn zip` 相当を維持

### 1-2. Jest → Vitest

- Vite の設定を共有できるので Vite の直後にやる
- ts-jest / jest-environment-jsdom を撤去

棚卸し結果 (2026-07 調査済み): テストは 9 ファイル・約 20 ケースと小規模で、
jest 固有 API は `jest.fn` (ColorImput.test.tsx のみ) しか使われていない。
移行コストは以下 2 点に集約される:

- **chrome mock の置換** (`jest-chrome` 依存は 3 ファイル):
  `src/components/options/App.test.tsx`, `src/components/popup/App.test.tsx`, `src/lib/tab.test.ts`。
  mock している API は `tabs.query` / `storage.sync.get` / `runtime.getManifest` の 3 つだけなので
  手書き mock でも十分小さい。`src/jest.setup.js` の chrome 注入も合わせて書き直す
  (TextEncoder/TextDecoder 注入は Node 24 では不要の可能性が高い)
- **snapshot の削除**: options/popup の `App.test.tsx` にある `document.body` 丸ごと snapshot
  (計 3 snapshot) は `jest-styled-components` の serializer に強依存。
  `toHaveStyleRule` の呼び出しはリポジトリ全体でゼロなので、
  **snapshot を明示的 assert に置き換えて `jest-styled-components` ごと削除**する。
  Phase 2 で styled-components 自体を廃止予定なのでこの方向で確定

その他: `src/lib/` の純関数テスト 4 ファイルと `gallery/gallery.test.ts` はほぼ無修正で動く見込み。
`transformIgnorePatterns` (react-dnd の ESM 対応) は Vitest では不要になる見込み。

### 1-3. gts → oxlint + フォーマッタ

- gts / ts-jest が消えると「TS 7 / ESLint 10 に上げられない」制約が解消される
  → **TypeScript 7 (tsgo) へのアップグレードがこの Phase の隠れた成果**
- フォーマッタは着手前に一度だけ決める:
  - oxfmt(若い、oxc に一本化できる)
  - Biome(lint + format 一体で成熟)
  - oxlint + Prettier 継続(保守的)
- husky / lint-staged の hook も新ツールに合わせて更新

## Phase 2: ライブラリ置換・堅牢化

着手前に E2E を拡充する: 現状の E2E は sandbox 評価往復と storage 永続化のみをカバーし、
関数の編集・削除・並び替え (react-dnd) は未カバー。react-dnd と storage を触る前に
並び替え・削除のテストを追加する。
(実ページの title/url 取得は activeTab が automation で発火しない制約により E2E 対象外のまま)

- **styled-components**(メンテナンスモード宣言済み)→ CSS Modules か vanilla-extract
  - UI 全面に及ぶので一括ではなくコンポーネント単位で段階移行
  - 最初に 1 コンポーネントで試してから移行先を確定する
- **react-dnd**(実質未メンテ)→ `dnd-kit` か `pragmatic-drag-and-drop`
  - 関数が多くなった時の並び替え性能にも直結
- **prismjs + react-simple-code-editor** → CodeMirror 6(編集体験も改善)
- **ajv + チェックイン済み `function.ajv.js`** → zod / valibot
  - 生成ファイルと `yarn validator` の運用が消え、schema と validator のドリフト問題も解消
- **storage の堅牢化(「関数が多くなると壊れる」の本丸)**:
  - `chrome.storage.sync` は 1 item 8KB / 全体 100KB の quota があり、関数が増えるとここで壊れる
  - チャンク分割 or `storage.local` フォールバック + エクスポート/インポート機能
  - config のスキーマバージョニング(migration 関数)をここで導入しておく

## Phase 3: クロスブラウザ対応

最大の設計判断は sandbox。**現在の `sandbox` manifest key は Chrome 専用**で、
Firefox / Safari は非対応のため、ユーザーコード実行の仕組み自体を変える。

- **有力案: QuickJS の WASM ビルド(quickjs-emscripten)でユーザー関数を実行**
  - CSP は `wasm-unsafe-eval` で通り、Chrome / Firefox / Safari すべて同一コードパス
  - iframe + postMessage プロトコル(`src/lib/eval.ts`)は温存できるので UI 側の変更は小さい
- 非推奨案: Chrome は現行 sandbox 維持 + Firefox/Safari だけ別実装
  → コードパスが割れて長期メンテ目標に反する
- ブラウザ API 層は `globalThis.browser ?? globalThis.chrome` の 1 行(WXT 方式)で十分
- manifest のブラウザ別出し分けは 1-1 で作るジェネレータに分岐を足す
- **Safari は別途コスト判断**: xcrun での App 化 + Apple Developer Program 年 $99 + App Store 審査
  → Firefox を先に出して Safari は需要を見てから、が現実的
- ストア提出の自動化は `publish-browser-extension` を直接使う(WXT 不要)

## 決めごとメモ

| 項目 | いつ決めるか |
|---|---|
| パッケージマネージャ | **決定済み (2026-07-18): pnpm**。npm (最薄・脱出容易だが速度と厳密さで劣る) と bun (最速だがランタイムごと寄せる意図がないなら PM だけ使う旨味が薄い) も検討した上で、速度・ディスク効率・幽霊依存検出・corepack でのバージョン固定を評価して pnpm を選択 |
| フォーマッタ(oxfmt / Biome / Prettier 継続) | Phase 1-3 着手前 |
| styled-components の移行先 | Phase 2 冒頭に 1 コンポーネントで試してから |
| Safari をスコープに入れるか | Phase 3 の設計には影響しない(QuickJS 案ならどちらでも同じ)ので後回しで OK |
