# cf-workers-og

Generate Open Graph images on Cloudflare Workers with Node.js bindings for local Vite dev.

An SVG-focused wrapper around [Satori](https://github.com/vercel/satori) + Yoga WASM that provides:

- Designed for Workers; includes Node.js bindings for local dev
- Works with both **Vite dev** and **Wrangler dev**
- Uses modern, maintained WASM dependencies
- SVG and PNG output (PNG via resvg WASM)
- Optional HTML string parsing (using battle-tested libraries)
- TypeScript support

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
HTML parsing is available via the opt-in `cf-workers-og/html` entrypoint.

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
- `cf-workers-og/html`: adds `parseHtml` and accepts HTML strings in `ImageResponse.create`.
- If your bundler ignores export conditions, use explicit paths like `cf-workers-og/node`,
  `cf-workers-og/workerd`, and their `/html` variants.

## Why Not workers-og?

The original [workers-og](https://github.com/syedashar1/workers-og) has fundamental issues that make it unsuitable for production use.

### 1. Outdated WASM Dependencies

workers-og uses `yoga-wasm-web@0.3.3` which has been **unmaintained since 2023**. The Yoga project moved to Yoga 3.0 with a `SINGLE_FILE=1` compilation that inlines WASM as base64 - incompatible with Cloudflare Workers' module-based WASM loading. Satori itself now uses an internal patched version instead of `yoga-wasm-web`, fragmenting the ecosystem.

### 2. Brittle HTML Parsing

The HTML parser builds JSON via string concatenation:

```typescript
// workers-og approach - error-prone
vdomStr += `{"type":"${element.tagName}", "props":{${attrs}"children": [`;
```

The code comments even acknowledge: *"very error prone. So it might need more hardening"*. The `sanitizeJSON` function only handles basic escapes, missing edge cases.

### 3. Style Parsing Fails on Complex CSS

workers-og uses regex to parse CSS: `;(?![^(]*\))`. This fails on:
- Nested parentheses: `calc(100% - (10px + 5px))`
- Data URIs: `url(data:image/png;base64,...)`
- Complex CSS with multiple function calls

### 4. No Vite Support

workers-og uses esbuild's copy loader for WASM, which is incompatible with Vite. The library only works with `wrangler dev`, not `vite dev` with `@cloudflare/vite-plugin`.

### 5. Debug Logs in Production

```typescript
console.log("init RESVG");  // Left in production code
```

### How cf-workers-og Solves These

| Issue | cf-workers-og Solution |
|-------|----------------------|
| **Outdated WASM** | Uses `satori@0.18.x` with `yoga-layout@3.x` (Yoga 3) and module-based WASM loading |
| **Brittle HTML parsing** | Uses [htmlparser2](https://github.com/fb55/htmlparser2) - a battle-tested streaming parser with no browser dependencies |
| **Style parsing** | Uses [style-to-js](https://www.npmjs.com/package/style-to-js) (1M+ weekly downloads) - handles all CSS edge cases |
| **No Vite support** | Works with `@cloudflare/vite-plugin` via proper conditional exports for node/workerd |
| **Debug logs** | Clean production code |

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

### `parseHtml(html)`

Parse an HTML string into React elements for Satori. Exported from `cf-workers-og/html`.

```typescript
const element = parseHtml('<div style="display: flex;">Hello</div>');
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
