LEARNINGS

Goal
- Replace @cf-wasm/* with Satori 0.18.3 + Yoga WASM and run in Cloudflare Workers.

Satori + Yoga facts
- There is no satori@18.0.3 on npm; the latest is satori@0.18.3.
- Satori 0.18.3 depends on yoga-layout@3.2.1 (not yoga-wasm-web).
- The default Satori build preloads Yoga via a base64 loader (yoga-layout/load) that
  compiles wasm from raw bytes at runtime. This is not compatible with Workers.
- The satori/standalone entrypoint exposes init(...) but it expects raw wasm bytes
  (ArrayBuffer or Node Buffer) and still compiles at runtime.
- yoga-layout does not export yoga.wasm via package exports.
- satori ships a yoga.wasm file but does not export it directly, so we vendored it.

Workers runtime constraint
- workerd (Wrangler dev) rejects wasm compilation from bytes with:
  "WebAssembly.instantiate(): Wasm code generation disallowed by embedder".
- This happens even if we provide correct bytes to init(...).
- Workers require module-based wasm loading: the wasm must be imported as a module
  (compiled ahead of time) and then instantiated from a WebAssembly.Module.
- Satori's standalone init does not currently accept a Module/Instance, so it cannot
  work in Workers without patching Satori's loader or build output.

WASM asset handling (Vite + library build)
- Vite does not support native wasm ESM imports in library mode; using *.wasm
  directly fails unless a plugin is added.
- Using "?url" makes Vite emit a data: URL by default in lib builds.
- Data URLs are still raw bytes; passing them to Satori init still triggers
  forbidden byte-compilation in workerd.
- To use wasm in Workers we need a module/instance path, not base64 bytes.

Repository implementation choices made
- Added vendored yoga.wasm under src/wasm/yoga.wasm.
- Workerd loader now imports yoga.wasm as a WebAssembly.Module and passes it to
  Satori init (module-based path).
- Node loader reads the wasm file from disk and converts the read buffer to a
  precise ArrayBuffer slice (copy) to satisfy typing/runtime expectations.
- Added TypeScript declaration for import.meta.url (workers types don't include it).
- Added wasm typings for "*.wasm" and "*.wasm?url".
- Marked node:fs/promises as external in vite.config.ts to avoid browser bundling
  errors in the workerd build.
- Externalized *.wasm in Vite and added a build copy step so dist/wasm/yoga.wasm
  ships alongside the workerd runtime.

Satori fork (option 1) patch details
- Patched yoga-layout's standalone loader to accept WebAssembly.Module or
  WebAssembly.Instance via Module.instantiateWasm.
- Updated Satori init types to accept Module/Instance (in yoga.ts/yoga.external.ts).
- Pinned tailwindcss to 3.4.16 so twrnc's resolveConfig import bundles cleanly.
- Built satori-fork successfully (dist + standalone + d.ts).

Example Worker (local dev)
- The example worker needed a local link dependency since this repo is not a
  pnpm workspace; examples/worker/package.json now uses "link:../..".
- The example imports parseHtml from cf-workers-og/html (not the main entry).
- Wrangler dev could not start in this sandbox due to EPERM when opening log
  files and binding local ports, plus EMFILE from file watchers.

What worked vs. what failed
- Satori fork builds and types compile, and the workerd runtime now imports a
  wasm module instead of bytes.
- Local wrangler dev was blocked by sandbox restrictions (log path and port bind),
  so the Worker run wasn't verified here.

WASM corruption note
- The yoga.wasm shipped in satori-fork/yoga.wasm (and via yoga-layout's dist
  binaries) was corrupted; WebAssembly.compile failed with a "section extends
  past end of module" error.
- yoga-layout also ships a valid base64 bundle in
  node_modules/yoga-layout/dist/binaries/yoga-wasm-base64-esm.js.
- Decoding that base64 string and overwriting src/wasm/yoga.wasm and
  satori-fork/yoga.wasm fixes the compile error.

Implication
- To run Satori 0.18.3 in Workers we must avoid byte compilation and use a
  module-based wasm path; the forked loader + externalized wasm import is the
  current approach.
