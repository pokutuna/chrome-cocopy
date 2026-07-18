# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the Manifest V3 extension. Runtime entry points are `popup.tsx`, `options.tsx`, and `sandbox.ts`.
- `src/lib/` holds shared domain logic, storage, validation, and the sandbox message protocol; React UI is under `src/components/`.
- Tests live beside their implementation as `*.test.ts` or `*.test.tsx`; Jest snapshots are stored in nearby `__snapshots__/` directories.
- `gallery/` is a separate gallery sub-project. Edit `gallery/gallery.yaml`; `gallery/README.md` is generated. `sozai/` contains source artwork and release assets.
- `build/` and packaged ZIPs are generated outputs and should not be edited or committed unless a release workflow requires them. The generated validator `src/lib/function.ajv.js` is checked in.

## Build, Test, and Development Commands

Use Node 24.15.0 from `.node-version` and pnpm with the committed lockfile (`pnpm-lock.yaml`); the pnpm version is pinned via `packageManager` in `package.json` (corepack).

- `pnpm install --frozen-lockfile` installs the exact dependency set.
- `pnpm test` runs Jest and then the `gts check` post-test lint/type checks.
- `pnpm run build` bundles the extension into `build/`; use `pnpm run watch` for incremental development.
- `pnpm run fix` applies gts formatting/lint fixes; the Husky pre-commit hook runs lint-staged automatically.
- `pnpm run validator` regenerates `src/lib/function.ajv.js` after schema changes.
- `pnpm run update-gallery` regenerates gallery documentation; `pnpm run zip` builds and archives the extension.

## Coding Style & Naming Conventions

Write TypeScript/TSX using the Google TypeScript Style enforced by gts (two-space indentation, single quotes, trailing commas). Use `PascalCase` for React components, `camelCase` for functions and variables, and descriptive `*.test.ts(x)` names. Keep shared types and protocols in `src/lib/` rather than duplicating them in components.

## Testing Guidelines

Jest with `ts-jest`, jsdom, and Testing Library is the project standard. Add or update a co-located test for behavior changes, and update snapshots intentionally. Run a focused test with `pnpm exec jest path/to/file.test.tsx`, then run `pnpm test` and `pnpm run build` before submitting.

## Architecture & Security Notes

User-defined functions must execute only in the isolated iframe (`src/sandbox.ts`), communicating through the protocol in `src/lib/eval.ts`; never evaluate them in popup or options code. Storage uses `chrome.storage.sync`, and function definitions are validated against `src/lib/function.schema.json`.

## Commit & Pull Request Guidelines

Follow the existing concise, conventional prefixes such as `fix:`, `docs:`, `chore:`, and `chore(deps):`; keep subjects imperative and focused. PRs should explain the user-visible change, link relevant issues, list validation commands, and include screenshots or recordings for UI changes. Mention regenerated validator/gallery files explicitly.
