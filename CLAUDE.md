# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cocopy is a Chrome extension (Manifest V3) that lets users copy text from web pages using custom JavaScript functions. Users define copy functions in the options page; these run in a sandboxed iframe for security, receiving page data (title, url, content, selected text) and writing the result to the clipboard.

## Tech Stack

- TypeScript, React 18, styled-components
- Webpack 5 (builds to `/build/`)
- Jest + React Testing Library + jest-chrome
- gts (Google TypeScript Style) for linting

## Essential Commands

```bash
yarn build              # Build extension to /build/
yarn watch              # Watch mode
yarn test               # Jest tests; `posttest` runs `gts check`, so a lint error fails this command
yarn jest <file>        # Run single test file (skips lint)
yarn fix                # Auto-fix lint issues
yarn validator          # Recompile function.ajv.js after editing function.schema.json
yarn update-gallery     # Regenerate gallery/README.md from gallery.yaml via gallery/generate.ts
yarn zip                # Build + zip /build/ as build-<version>.zip for store upload
```

Node 24 is pinned (`engines.node: ">=24"`, mise targets 24.15.0).

## Architecture

Three Webpack entry points in `src/`:

- **`popup.tsx`** - Popup UI shown when user clicks the extension icon
- **`options.tsx`** - Settings page for creating/editing copy functions
- **`sandbox.ts`** - Isolated iframe that evaluates user-defined functions via `postMessage`

The sandbox pattern is the core design: user code never runs in the extension context. The popup/options page posts `{command: 'eval' | 'parse', code, arg}` to the sandbox iframe; the sandbox evals the code as a function and returns a `CopyResult` that must be `string | number | {html: string, text: string} | null | undefined`. See `src/lib/eval.ts` for the protocol and `src/lib/function.ts` for the CopyFunction type.

Storage is via `chrome.storage.sync` (see `src/lib/config.ts`). Functions are validated against `src/lib/function.schema.json`; the compiled validator `function.ajv.js` is checked in and must be regenerated with `yarn validator` after schema edits.

`gallery/` is a separate sub-project: `gallery.yaml` is the source of truth for shareable example functions, and `yarn update-gallery` regenerates `gallery/README.md` from it.
