# cf-workers-og

Generate Open Graph images on Cloudflare Workers with Node.js bindings for local Vite dev.

A Workers-first wrapper around [Satori](https://github.com/vercel/satori) + Yoga WASM
with PNG output via resvg that provides:

- Designed for Workers; includes Node.js bindings for local dev
- Works with both **Vite dev** and **Wrangler dev**
- Uses modern, maintained WASM dependencies
- SVG and PNG output (PNG via resvg WASM)
- Optional HTML string parsing (using battle-tested libraries)
- TypeScript support

## V3 Release Highlights (3.0.0)

- Latest Satori 0.18.3 + Yoga 3.2.1 with Workers-safe WASM initialization
- PNG output by default (SVG still available with `format: "svg"`)
- SVG -> PNG via `@resvg/resvg-wasm` with vendored WASM assets
- HTML strings accepted directly in `cf-workers-og/html`
- Bundled Roboto Regular fallback font (no more "no fonts loaded" errors)

## Installation

```bash
npm install cf-workers-og
# or
pnpm add cf-workers-og
```

## Quick Start

### Basic Usage (JSX, recommended)

```tsx
import { ImageResponse } from "cf-workers-og";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return ImageResponse.create(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: 60,
        }}
      >
        Hello World
      </div>,
      { width: 1200, height: 630 }
    );
  },
};
```

### With Google Fonts

Fonts are optional; if you don’t pass any, the bundled Roboto Regular is used.

```tsx
import { ImageResponse, GoogleFont, cache } from "cf-workers-og";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Required when using GoogleFont
    cache.setExecutionContext(ctx);

    return ImageResponse.create(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#000",
          color: "#fff",
          fontFamily: "Inter",
          fontSize: 60,
        }}
      >
        Hello World
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [new GoogleFont("Inter", { weight: 700 })],
      }
    );
  },
};
```

### HTML String Usage

Use HTML parsing only if you need it. For new projects, JSX is the simplest and most reliable.
HTML parsing is available via the opt-in `cf-workers-og/html` entrypoint, and you can pass
raw HTML strings directly to `ImageResponse.create(...)`.

```typescript
import { ImageResponse } from "cf-workers-og/html";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const html = `
      <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #000; color: #fff;">
        <h1 style="font-size: 60px;">Hello from HTML</h1>
      </div>
    `;

    return ImageResponse.create(html, {
      width: 1200,
      height: 630,
    });
  },
};
```

## Vite Configuration

Add the Cloudflare Vite plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
});
```

Vite dev runs in Node.js, so this package ships Node bindings that should be picked automatically. If your bundler does not respect export conditions, use explicit paths like `cf-workers-og/node`.

## Which entrypoint should I use?

- `cf-workers-og` (recommended): JSX input only, clean API for new users.
- `cf-workers-og/html`: accepts raw HTML strings in `ImageResponse.create`.
- If your bundler ignores export conditions, use explicit paths like `cf-workers-og/node`,
  `cf-workers-og/workerd`, and their `/html` variants.

## Why Not workers-og?

The original [workers-og](https://github.com/syedashar1/workers-og) has fundamental issues that make it unsuitable for production use.

### The blockers we hit in Workers

- **WASM byte compilation is disallowed** in workerd, so loaders that call
  `WebAssembly.instantiate(bytes)` fail at runtime.
- **Outdated Yoga WASM**: `yoga-wasm-web@0.3.3` is unmaintained and incompatible
  with Yoga 3’s `SINGLE_FILE=1` base64 output (also not Workers-safe).
- **Brittle HTML/CSS parsing**: regex-based parsing breaks on real-world CSS.
- **Build tooling gap**: workers-og is esbuild-only and doesn’t play well with
  Vite library builds and export conditions.

### How cf-workers-og v3 solves this (engineering highlights)

- **Latest Satori + Yoga**: uses `satori@0.18.3` with `yoga-layout@3.2.1` and a
  patched loader that accepts `WebAssembly.Module/Instance`.
- **Workers-safe WASM**: Yoga + resvg WASM are vendored and imported as modules,
  never compiled from raw bytes at runtime.
- **PNG by default**: SVG → PNG via `@resvg/resvg-wasm`, with `format: "svg"`
  available when you want raw SVG.
- **Zero-config fonts**: bundled Roboto Regular so layout never fails when users
  omit fonts; custom fonts still fully supported.
- **Reliable HTML/CSS**: `htmlparser2` + `style-to-js` handle edge cases that
  workers-og’s regex parsing misses.
- **Vite + Wrangler ready**: proper export conditions, wasm assets copied to
  `dist/wasm`, and no bundler-specific hacks required.

### Design Decisions

**Why Satori + Yoga instead of building from scratch?**

WASM on Cloudflare Workers is genuinely hard. Workers cannot compile WASM from arbitrary data blobs - you must import as modules. Satori already provides a well-tested SVG renderer, so we focus on making its Yoga WASM initialization work in Workers.

**Why htmlparser2 instead of html-react-parser?**

`html-react-parser` uses `html-dom-parser` which detects the environment. Cloudflare Workers is incorrectly detected as a browser, causing it to use `document.implementation.createHTMLDocument` which doesn't exist. `htmlparser2` is a pure streaming parser that works everywhere.

## API Reference

### Entry points

Use `cf-workers-og` for Workers with JSX input and `cf-workers-og/html` for HTML strings.
If your bundler ignores export conditions, use explicit paths like `cf-workers-og/node` or
`cf-workers-og/workerd` (and the `/html` variants).

### `ImageResponse.create(element, options)`

Generate an OG image Response.
Main entrypoint expects a React element; `cf-workers-og/html` also accepts HTML strings.

```typescript
const response = await ImageResponse.create(element, {
  width: 1200, // Default: 1200
  height: 630, // Default: 630
  format: "png", // 'png' | 'svg', Default: 'png'
  fonts: [], // Font configurations (defaults to bundled Roboto Regular)
  emoji: "twemoji", // Emoji provider
  debug: false, // Disable caching for debugging
  headers: {}, // Additional response headers
  status: 200, // HTTP status code
  statusText: "", // HTTP status text
});
```

### `GoogleFont(family, options)`

Load a Google Font.

```typescript
const font = new GoogleFont("Inter", { weight: 700 });
```

### `loadGoogleFont(options)` (Deprecated)

Backwards-compatible function for loading Google Fonts. Prefer `GoogleFont` class.

```typescript
const fontData = await loadGoogleFont({ family: "Inter", weight: 700 });
```

### `cache.setExecutionContext(ctx)`

**Only required when using `GoogleFont`**. Not needed if you use the default font or `CustomFont`.

```typescript
// Only if using GoogleFont:
cache.setExecutionContext(ctx);

const response = await ImageResponse.create(element, {
  fonts: [new GoogleFont("Inter", { weight: 700 })],
});
```

The `GoogleFont` class caches font files using Cloudflare's Cache API to avoid re-fetching on every request. The Cache API requires access to the execution context.

**When you DON'T need it:**
- Using no fonts (default Noto Sans is bundled)
- Using `CustomFont` with your own font data

## Migrating from workers-og

Note that cache is only used if you use GoogleFonts. Otherwise it is a drop-in replacement.

```diff
- import { ImageResponse } from 'workers-og';
+ import { ImageResponse, cache } from 'cf-workers-og';

export default {
  async fetch(request, env, ctx) {
+   cache.setExecutionContext(ctx);

    return ImageResponse.create(element, options);
  }
};
```

For HTML string users:

```diff
- return new ImageResponse(htmlString, options);
+ import { ImageResponse } from 'cf-workers-og/html';
+ return ImageResponse.create(htmlString, options);
```

## Architecture

This package is a **thin wrapper** around Satori + Yoga. The heavy lifting is done by:

| Package | Purpose | Notes |
|---------|---------|-------|
| `satori` | SVG rendering | Outputs SVG |
| `yoga-layout` | Flexbox layout (WASM) | Yoga 3; wasm is vendored for Workers |
| `@resvg/resvg-wasm` | SVG → PNG | WASM renderer |
| `htmlparser2` | HTML parsing (pure JS) | Optional entrypoint |

## License

MIT
