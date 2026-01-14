# Changelog

All notable changes to this project will be documented in this file.

## [3.0.1] - 2026-01-14

### Fixed

- Workers timeout when `satori` is resolved from consumer dependencies by bundling the patched
  loader into the published build output

## [3.0.0] - 2026-01-14

### Breaking Changes

- **PNG is now the default output** - use `format: "svg"` for SVG
- **Removed compat entrypoint** - only `cf-workers-og` and `cf-workers-og/html` remain
- **Constructor usage removed** - use `ImageResponse.create(...)` only
- **HTML strings accepted directly** in `cf-workers-og/html` (no `parseHtml` required)

### Added

- Latest `satori@0.18.3` + `yoga-layout@3.2.1` with Workers-safe module init
- SVG -> PNG via `@resvg/resvg-wasm` with vendored WASM assets
- Bundled Roboto Regular fallback font (prevents "no fonts loaded" errors)
- `LEARNINGS.md` restored and expanded for long-term context
- `scripts/refresh-yoga-wasm.mjs` and `scripts/refresh-resvg-wasm.mjs`

### Changed

- Workerd runtime now loads Yoga and resvg as module-based WASM imports
- Build now ships `dist/wasm/{yoga,resvg}.wasm`
- HTML entrypoint now prefers raw string inputs for convenience

### Fixed

- workerd errors from byte-compiled WASM (`Wasm code generation disallowed`)
- workerd init hangs when Yoga is a WebAssembly module or instance

## [2.0.0] - 2026-01-12

### Breaking Changes

- **Removed `parseHtml` from main export** - HTML parsing is now opt-in via `cf-workers-og/html`
- **Constructor now throws by default** - Use `ImageResponse.create()` instead of `new ImageResponse()`
- **Separated entrypoints** - The package now has three distinct entrypoints:
  - `cf-workers-og` - JSX only (recommended)
  - `cf-workers-og/html` - JSX + HTML string parsing
  - `cf-workers-og/compat` - Full workers-og constructor compatibility

### Added

- New `cf-workers-og/html` entrypoint for HTML string support without legacy constructor
- New `cf-workers-og/compat` entrypoint for workers-og migration with Promise-returning constructor
- Factory pattern for `ImageResponse` class creation (`createImageResponseClass`)
- `AsyncFontConfig` and `FontInput` types for better font handling
- Explicit `./node`, `./workerd`, and variant paths for bundlers that ignore export conditions
- New tests for each entrypoint (compat, html, node)

### Changed

- Refactored `image-response.ts` and `image-response.node.ts` to use shared factory
- Moved `loadGoogleFont` and `createFontConfig` to shared module (`fonts.shared.ts`)
- Updated README with clearer entrypoint documentation
- Improved error messages to guide users to correct imports

### Removed

- `LEARNINGS.md` - content moved to README "Why Not workers-og?" section (restored in 3.0.0)

## [1.0.1] - 2026-01-11

### Fixed

- Handle undefined font configurations
- ESLint config for test files
- Simplified CI to Node 22

### Added

- Node.js exports for local development with Vite

## [1.0.0] - 2026-01-10

### Added

- Initial release
- `ImageResponse.create()` for generating OG images
- HTML string parsing with `parseHtml()`
- Google Font support via `GoogleFont` class
- Custom font support via `CustomFont` class
- Works with both Vite dev and Wrangler dev
- TypeScript support
- Backwards-compatible API for workers-og users
