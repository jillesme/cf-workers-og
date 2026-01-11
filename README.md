# cf-workers-og

Generate Open Graph images on Cloudflare Workers with Vite support.

A thin wrapper around [@cf-wasm/og](https://github.com/fineshopdesign/cf-wasm) that provides:

- Works with both **Vite dev** and **Wrangler dev**
- Uses modern, maintained WASM dependencies
- Robust HTML string parsing (using battle-tested libraries)
- Backwards-compatible API for workers-og users
- TypeScript support

## Installation

```bash
npm install cf-workers-og
# or
pnpm add cf-workers-og
```

## Quick Start

### Basic Usage (JSX)

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

```typescript
import { ImageResponse, parseHtml } from "cf-workers-og";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const html = `
      <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #000; color: #fff;">
        <h1 style="font-size: 60px;">Hello from HTML</h1>
      </div>
    `;

    return ImageResponse.create(parseHtml(html), {
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

## Why Not workers-og?

The original [workers-og](https://github.com/syedashar1/workers-og) library has several issues:

| Issue                     | Details                                                                     |
| ------------------------- | --------------------------------------------------------------------------- |
| **Outdated WASM**         | Uses yoga-wasm-web 0.3.3 (unmaintained since 2023) and resvg-wasm 2.4.0     |
| **Console logs**          | Debug logs left in production code (`og.ts:16,18,20`)                       |
| **Brittle HTML parsing**  | Manual JSON string concatenation (`vdomStr +=`) - error-prone               |
| **No Vite support**       | Uses esbuild copy loader, incompatible with Vite's WASM handling            |

### How cf-workers-og Solves These

- **Modern WASM**: Uses `@cf-wasm/og` which is actively maintained (Dec 2025) with up-to-date yoga and resvg
- **No debug logs**: Clean production code
- **Robust HTML parsing**: Uses [htmlparser2](https://github.com/fb55/htmlparser2) + [style-to-js](https://www.npmjs.com/package/style-to-js) for proper DOM/CSS parsing (works in Workers, unlike browser-based parsers)
- **Vite compatible**: Works with `@cloudflare/vite-plugin` out of the box

## API Reference

### `ImageResponse.create(element, options)`

Generate an OG image Response.

```typescript
const response = await ImageResponse.create(element, {
  width: 1200, // Default: 1200
  height: 630, // Default: 630
  format: "png", // 'png' | 'svg', Default: 'png'
  fonts: [], // Font configurations
  emoji: "twemoji", // Emoji provider
  debug: false, // Disable caching for debugging
  headers: {}, // Additional response headers
  status: 200, // HTTP status code
  statusText: "", // HTTP status text
});
```

### `parseHtml(html)`

Parse an HTML string into React elements for Satori.

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

```diff
- import { ImageResponse } from 'workers-og';
+ import { ImageResponse, cache } from 'cf-workers-og';

export default {
  async fetch(request, env, ctx) {
+   cache.setExecutionContext(ctx);

    return new ImageResponse(element, options);
  }
};
```

For HTML string users:

```diff
- return new ImageResponse(htmlString, options);
+ import { parseHtml } from 'cf-workers-og';
+ return ImageResponse.create(parseHtml(htmlString), options);
```

## Architecture

This package is a **thin wrapper** (6 KB) around `@cf-wasm/og`. The heavy lifting is done by:

| Package | Size | Purpose |
|---------|------|---------|
| `@cf-wasm/resvg` | 2.4 MB | SVG → PNG rendering (WASM) |
| `@cf-wasm/satori` | 87 KB | Flexbox layout engine (WASM) |
| `htmlparser2` | ~42 KB | HTML parsing (pure JS) |

The WASM files are installed as transitive dependencies - they're not bundled in this package.

## Local Development

To test changes locally before publishing:

```bash
# In cf-workers-og directory
pnpm build
pnpm link --global

# In your Astro/other project
pnpm link --global cf-workers-og
```

Then in your Astro project's API route:

```tsx
// src/pages/og/[...slug].ts (Astro on Cloudflare)
import type { APIRoute } from "astro";
import { ImageResponse } from "cf-workers-og";

export const GET: APIRoute = async ({ params }) => {
  // No cache.setExecutionContext needed - using default font
  return ImageResponse.create(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", width: "100%", height: "100%" }}>
      <h1 style={{ fontSize: 60 }}>Hello {params.slug}</h1>
    </div>,
    { width: 1200, height: 630 }
  );
};
```

If using Google Fonts:

```tsx
import { ImageResponse, GoogleFont, cache } from "cf-workers-og";

export const GET: APIRoute = async ({ params, locals }) => {
  // Required for GoogleFont caching
  const ctx = (locals as any).runtime?.ctx;
  if (ctx) cache.setExecutionContext(ctx);

  return ImageResponse.create(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", width: "100%", height: "100%" }}>
      <h1 style={{ fontSize: 60, fontFamily: "Inter" }}>Hello {params.slug}</h1>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [new GoogleFont("Inter", { weight: 700 })],
    }
  );
};
```

To unlink after testing:

```bash
# In your Astro project
pnpm unlink cf-workers-og

# In cf-workers-og directory
pnpm unlink --global
```

## License

MIT
