LEARNINGS

Goal
- Replace @cf-wasm/* with Satori 0.18.3 + Yoga WASM and run in Cloudflare Workers.
- Option chosen: fork Satori + vendor wasm (start with SVG; resvg later).

Quickstart (repeatable)
- `pnpm -C satori-fork build`
- `node scripts/refresh-yoga-wasm.mjs` (regenerate vendor wasm)
- `node scripts/refresh-resvg-wasm.mjs` (regenerate resvg wasm)
- `pnpm build`
- `pnpm dlx wrangler dev`

Key constraints and facts
- The latest Satori on npm is satori@0.18.3 (not 18.0.3).
- Satori 0.18.3 depends on yoga-layout@3.2.1 (not yoga-wasm-web).
- Default Satori/yoga-layout loaders compile wasm from raw bytes at runtime.
- workerd disallows wasm compilation from bytes:
  "WebAssembly.instantiate(): Wasm code generation disallowed by embedder".
- Workers require module-based wasm loading (import a precompiled
  WebAssembly.Module and instantiate it).
- Vite library builds do not support native wasm ESM imports; "?url" produces
  data: URLs, which are still raw bytes and thus still blocked by workerd.

Approach that works in Workers
- Import a WebAssembly.Module in the workerd runtime and pass it to Satori init.
- Patch Satori/yoga-layout to accept Module/Instance in init.
- Externalize wasm in Vite and copy it to dist at build time.
- Use @resvg/resvg-wasm with initWasm(WebAssembly.Module) for SVG -> PNG.

Satori fork (./satori-fork) changes
- Patched yoga-layout loader to accept Module/Instance:
  `satori-fork/patches/yoga-layout@3.2.1.patch`
  - Adds `instantiateWasm` when input is WebAssembly.Module/Instance.
  - Only uses `wasmBinary` when raw bytes are passed.
- Updated Satori init types to accept Module/Instance:
  `satori-fork/src/yoga.ts`, `satori-fork/src/yoga.external.ts`.
- Pin tailwindcss to 3.4.16 to keep twrnc's resolveConfig bundling clean:
  `satori-fork/package.json` overrides.
- Minor type casts to satisfy DTS build:
  `satori-fork/src/handler/expand.ts`.
- Build command: `pnpm -C satori-fork build` (dist + standalone + d.ts).

Repo changes (cf-workers-og)
- Satori dependency points to the fork:
  `package.json` -> `"satori": "file:./satori-fork"`.
- Worker runtime imports Yoga as a wasm module:
  `src/runtime/yoga.workerd.ts` returns WebAssembly.Module/Instance.
- Vendored wasm:
  `src/wasm/yoga.wasm`, `src/wasm/resvg.wasm`.
- Node runtimes load wasm from `./wasm/*.wasm` with `/* @vite-ignore */` to
  avoid inlining large base64 blobs in dist.
- TypeScript wasm typings:
  `src/wasm.d.ts` (exports Module/Instance),
  plus `src/import-meta.d.ts` for `import.meta.url` typing.
- Vite config:
  `vite.config.ts` externalizes `*.wasm`, `@resvg/resvg-wasm`, and `node:fs/promises`.
- Build copy step:
  `scripts/copy-wasm.mjs` + `package.json` build script:
  `vite build && node scripts/copy-wasm.mjs && tsc --emitDeclarationOnly`.
- Output:
  `dist/wasm/yoga.wasm` and `dist/wasm/resvg.wasm` ship alongside workerd builds.

PNG support (resvg)
- Added `@resvg/resvg-wasm` and vendored `index_bg.wasm` into
  `src/wasm/resvg.wasm` via `scripts/refresh-resvg-wasm.mjs`.
- New runtime loaders:
  `src/runtime/resvg.workerd.ts` loads a WebAssembly.Module and calls initWasm.
  `src/runtime/resvg.node.ts` reads the wasm bytes from disk and calls initWasm.
- Satori runtimes export `renderPng` by rendering SVG and piping it through resvg.
- `ImageResponse.create` now supports `format: "png"` and returns a PNG response.

WASM corruption fix (important)
- The yoga.wasm shipped in satori/yoga-layout dist was corrupted.
- Symptom: `CompileError: ... section extends past end of the module`.
- The valid bytes live in:
  `satori-fork/node_modules/yoga-layout/dist/binaries/yoga-wasm-base64-esm.js`.
- Fix by decoding that base64 and overwriting both:
  `src/wasm/yoga.wasm` and `satori-fork/yoga.wasm`.
- One-shot fix:
- `node scripts/refresh-yoga-wasm.mjs`
- Sanity check:
  `node -e "WebAssembly.compile(require('fs').readFileSync('src/wasm/yoga.wasm')).then(()=>console.log('ok'))"`

Local dev (Wrangler)
- Run with: `pnpm dlx wrangler dev`.
- The example worker uses a local link dependency:
  `examples/worker/package.json` -> `"link:../.."`.
- Example imports `parseHtml` from `cf-workers-og/html`.
- If you see "Wasm code generation disallowed", the runtime is still compiling
  bytes instead of using a Module (re-check `src/runtime/yoga.workerd.ts` and
  the Satori fork patch).
- If you see "section extends past end", the wasm is corrupted; re-run the base64
  extraction fix above.
- `pnpm dlx wrangler dev` may warn about ignored build scripts; use
  `pnpm approve-builds` if you need those scripts (not required for this flow).

Why this works
- workerd only accepts precompiled wasm modules. By importing `.wasm` as a
  module and allowing Satori init to accept that Module, we avoid runtime byte
  compilation and keep Yoga wasm compatible with Workers.

Implication for future upgrades
- If Satori/yoga-layout changes their loader APIs or Yoga package layout,
  re-apply the same logic: ensure init can accept Module/Instance and ensure
  the wasm import is a module (not bytes or data URLs).

PNG support (completed)
- Implemented SVG -> PNG conversion using @resvg/resvg-wasm with module-based init.
- New runtime helpers:
  `src/runtime/resvg.workerd.ts` (initWasm with WebAssembly.Module)
  `src/runtime/resvg.node.ts` (initWasm with bytes from disk)
- Satori runtimes now export `renderPng`:
  `src/runtime/satori.workerd.ts`, `src/runtime/satori.node.ts`.
- ImageResponse now supports `format: "png"` for all entrypoints:
  `src/core/image-response.ts`, plus wiring in `src/image-response.ts`,
  `src/html.ts`, `src/compat.ts`, and node variants.
- Vendored wasm:
  `src/wasm/resvg.wasm` copied from `node_modules/@resvg/resvg-wasm/index_bg.wasm`.
- New helper script:
  `scripts/refresh-resvg-wasm.mjs` (re-vendor resvg wasm on upgrade).
- Build copy step now ships both wasm files:
  `scripts/copy-wasm.mjs` -> `dist/wasm/{yoga,resvg}.wasm`.
- Vite externalization includes `@resvg/resvg-wasm` so the wasm wrapper is not bundled.
- Node runtimes use `/* @vite-ignore */` and relative `./wasm/*.wasm` URLs
  to avoid Vite inlining large base64 blobs into dist.
- Example Worker now includes `/png` route for quick validation:
  `examples/worker/src/index.tsx`.

Validation notes
- `WebAssembly.compile` succeeds on `src/wasm/resvg.wasm` after vendoring.
- `dist/wasm/` contains both `resvg.wasm` (~2.4MB) and `yoga.wasm` (~70KB).
- For local validation: `pnpm dlx wrangler dev` and hit `/png`.
