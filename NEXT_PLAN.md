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

### 1-1. Webpack → Vite — **完了 (2026-07-18, branch: vite-migration)**

実施済み: `vite.config.ts` (3 HTML entry の MPA、root=src/、base='./'、minify なし +
inline sourcemap 維持) + `scripts/vite-manifest-plugin.ts` (manifest への version/
version_name 注入と img コピー。`buildManifest()` を独立関数にしてあり Phase 3 の
ブラウザ分岐はここに足す)。licenses.txt は rollup-plugin-license で再現。
webpack 系依存 9 個を削除。webpack との差分: Rollup が共有コードを `chunks/` に
括り出す (sandbox も拡張自身の chunk を読むが、ユーザーコード隔離には影響なし)。

- popup / options / sandbox を `rollupOptions.input` に列挙する MPA ビルド
- manifest は手書きテンプレ + 50〜100 行のジェネレータ
  (version 注入、将来のブラウザ分岐用のフック)
- `@crxjs/vite-plugin` はメンテが不安定なので使わない
- zip 化は既存の `yarn zip` 相当を維持

### 1-2. Jest → Vitest — **完了 (2026-07-18)**

実施済み: `vitest.config.ts` (root 直下、`include` で `src/**` と `gallery/**` の両方を拾う。
`vite.config.ts` は root=src/ のビルド専用設定なので test 設定は分離) + `vitest.setup.ts`
(chrome API の手書き mock: `tabs.query` / `storage.sync.get` / `storage.onChanged`
(add/removeListener, `useSubscribeFunctions` が使用、棚卸し時に見落とし) /
`runtime.getManifest`)。`globals: true` + tsconfig `types` に `vitest/globals` を追加し
既存テストの `test`/`describe`/`expect` を無改修で動作させた。

jest 固有 API は `jest.fn` (ColorImput.test.tsx) のみで `vi.fn` に置換。chrome mock を使う
3 ファイル (`options/App.test.tsx`, `popup/App.test.tsx`, `lib/tab.test.ts`) は
`vi.mocked(chrome.xxx).mockImplementation(...)` の形に書き換え。

snapshot 3 件 (`document.body` 丸ごと、`jest-styled-components` serializer 依存) は削除し、
明示的 assert (見出しテキスト、関数名、フッターリンクの href、install フォームの各フィールド値
など、snapshot の中身から検証意図を読み取って再現) に置き換えた。`__snapshots__/` ディレクトリも削除。
`toHaveValue`/`toHaveTextContent` は改行やホワイトスペースの正規化差でハマったため、
コードエディタの値検証は `toHaveTextContent` ではなく `toHaveValue` を使用。

`src/jest.setup.js` の TextEncoder/TextDecoder 注入は Node 24 + jsdom では不要で削除。
`transformIgnorePatterns` (react-dnd の ESM 対応) と `moduleNameMapper` (CSS) は
Vitest (Vite ベースの transform) では不要になり削除。

jest 系依存 8 個 (jest, ts-jest, jest-environment-jsdom, jest-chrome, jest-styled-components,
identity-obj-proxy, @types/jest, eslint-plugin-jest) を削除し、vitest / jsdom /
`@vitest/eslint-plugin` を追加。eslint.config.js は `eslint-plugin-jest` → `@vitest/eslint-plugin`
に置き換え、`vitest/valid-title` は `gallery/gallery.test.ts` が yaml のカテゴリ名を実行時に
test title へ使う都合上 off のまま維持(旧 `jest/valid-title` off を踏襲)。

`pnpm test` (Vitest 22 ケース + gts check) / `pnpm run build` / `pnpm e2e` (2/2) すべて green。

### 1-3. gts → oxlint + oxfmt — **完了 (2026-07-19, branch: oxc-migration)**

実施済み: oxlint@1.74 (`.oxlintrc.json`) + oxfmt@0.59 (`.oxfmtrc.json`、prettier 設定から
移行 + `useTabs: false` / `tabWidth: 2` を明示 + `sortImports: true`)。
eslint.config.js / .prettierrc.js を削除し、`check` = `oxlint && oxfmt --check . && tsc --noEmit`、
`fix` = `oxlint --fix && oxfmt .` に。lint-staged も更新。tsconfig は gts の
tsconfig-google.json を inline 化して自己完結に。

**重要な発見: gts check は ESLint のみで型チェックしていなかった**。Vite (esbuild) も
Vitest も型を見ないため、`tsc --noEmit` を `typecheck` script として check チェーンに追加。
これにより vite.config.ts の潜在型エラー (`dependency.name: string | null` での
Record インデックス) が実際に見つかり修正された。

rule の判断メモ (.oxlintrc.json にコメントで記載):
`eslint/no-unused-expressions` off (副作用 ternary が既存パターン)、
`react-hooks/exhaustive-deps` off (旧設定に hooks ルールは無く、既存の依存配列は意図的。
有効化は別タスク)、`vitest/require-mock-type-parameters` off、
テストファイルで `vitest/valid-title` off (gallery.test.ts の動的 title、旧設定踏襲)。
oxfmt の対象は ts/tsx/js のみ (md/html/css/json は ignore し無関係な差分を回避)。

- gts (が bundle する typescript-eslint) が消えると「TS 7 / ESLint 10 に上げられない」制約が解消される
  → **TypeScript 7 (tsgo) へのアップグレードは別タスクとして意図的に先送り**
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
  - **着手時に chrome mock を `@webext-core/fake-browser` へ切り替えるか判断する**:
    Phase 1-2 では mock 対象が 3 API のみのため手書き mock を採用したが、
    チャンク分割・migration のテストでは storage をインメモリ実装した fake
    (set→get の往復や onChanged が本物同様に動く) の方が明確に楽になる。
    差し替えは setup ファイル 1 箇所なので切り替えコストはほぼない。
    なお vitest-chrome (jest-chrome の Vitest 移植) はメンテ停滞のため採用しない

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
| フォーマッタ(oxfmt / Biome / Prettier 継続) | **決定済み (2026-07-18): oxfmt + oxlint**。oxc に一本化。Vite+ (oxlint/oxfmt/tsgo を束ねる統合ツール) は 2026-07-02 に beta が出たばかりのため今回は見送り、stable 到達時に再検討 |
| styled-components の移行先 | Phase 2 冒頭に 1 コンポーネントで試してから |
| Safari をスコープに入れるか | Phase 3 の設計には影響しない(QuickJS 案ならどちらでも同じ)ので後回しで OK |
