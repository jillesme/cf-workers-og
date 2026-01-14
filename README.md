# cf-workers-og

Generate Open Graph images on Cloudflare Workers. Latest Satori, proper WASM, works everywhere.

## Why this package

| Feature          | cf-workers-og                                              |
| ---------------- | ---------------------------------------------------------- |
| Satori           | 0.18.3 (latest)                                            |
| Yoga layout      | yoga-layout 3.2.1 (not the abandoned yoga-wasm-web)        |
| WASM loading     | Module imports (Workers-safe, no runtime byte compilation) |
| HTML/CSS parsing | htmlparser2 + style-to-js (not regex)                      |
| Output formats   | PNG default, SVG optional                                  |
| Fonts            | Bundled Roboto fallback + Google Fonts support             |
| Dev environments | Vite dev + Wrangler dev                                    |

## Installation

```bash
npm install cf-workers-og
```

## Quick Start

### With JSX

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

### With HTML

```typescript
import { ImageResponse } from "cf-workers-og/html";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const html = `
      <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 60px;">
        Hello World
      </div>
    `;

    return ImageResponse.create(html, { width: 1200, height: 630 });
  },
};
```

## Google Fonts

```tsx
import { ImageResponse, GoogleFont, cache } from "cf-workers-og";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    cache.setExecutionContext(ctx); // Required for font caching

    return ImageResponse.create(
      <div style={{ fontFamily: "Inter", fontSize: 60 }}>Hello World</div>,
      {
        width: 1200,
        height: 630,
        fonts: [new GoogleFont("Inter", { weight: 700 })],
      }
    );
  },
};
```

## API

### `ImageResponse.create(element, options)`

| Option    | Type               | Default        | Description      |
| --------- | ------------------ | -------------- | ---------------- |
| `width`   | number             | 1200           | Image width      |
| `height`  | number             | 630            | Image height     |
| `format`  | `"png"` \| `"svg"` | `"png"`        | Output format    |
| `fonts`   | Font[]             | Roboto Regular | Custom fonts     |
| `emoji`   | string             | `"twemoji"`    | Emoji provider   |
| `headers` | object             | `{}`           | Response headers |
| `status`  | number             | 200            | HTTP status      |

### Fonts

```typescript
// Google Font (requires cache.setExecutionContext)
new GoogleFont("Inter", { weight: 700 });

// Custom font
new CustomFont("MyFont", fontData, { weight: 400 });
```

### Entrypoints

| Entrypoint           | Input               |
| -------------------- | ------------------- |
| `cf-workers-og`      | JSX elements        |
| `cf-workers-og/html` | HTML strings or JSX |

If your bundler ignores export conditions, use explicit paths: `cf-workers-og/workerd`, `cf-workers-og/node`.

## Vite Configuration

```typescript
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
});
```

## Architecture

| Package           | Purpose               |
| ----------------- | --------------------- |
| satori 0.18.3     | JSX to SVG            |
| yoga-layout 3.2.1 | Flexbox layout (WASM) |
| @resvg/resvg-wasm | SVG to PNG (WASM)     |
| htmlparser2       | HTML parsing          |

WASM binaries are vendored and loaded as modules to comply with Workers' restrictions on runtime WASM compilation.

## License

MIT
