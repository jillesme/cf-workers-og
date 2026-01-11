# Learnings: Building cf-workers-og

This document captures the design decisions and technical learnings from building `cf-workers-og` as a replacement for `workers-og`.

---

## What's Wrong with workers-og

### 1. Outdated WASM Dependencies

**Location:** `packages/workers-og/package.json:31-34`

```json
{
  "yoga-wasm-web": "0.3.3",
  "@resvg/resvg-wasm": "2.4.0"
}
```

**Problems:**
- `yoga-wasm-web` has been **unmaintained since 2023**
- The Yoga project moved to Yoga 3.0 with a `SINGLE_FILE=1` compilation that inlines WASM as base64 - incompatible with Cloudflare Workers' module-based WASM loading
- Satori itself now uses an "inline patched version of yoga-layout" instead of `yoga-wasm-web`
- This means the ecosystem has fragmented, and maintaining your own yoga-wasm build is required if building from scratch

### 2. Console Logs in Production

**Location:** `packages/workers-og/src/og.ts:16,18,20`

```typescript
const initResvgWasm = async () => {
  try {
    console.log("init RESVG");  // <- Debug log
    await initWasm(resvgWasm as WebAssembly.Module);
    console.log("init RESVG");  // <- Debug log
  } catch (err) {
    console.log(err);           // <- Logs raw error object
    // ...
  }
};
```

These debug statements pollute production logs and should have been removed before publishing.

### 3. Brittle HTML Parsing

**Location:** `packages/workers-og/src/parseHtml.ts`

The HTML parser uses manual JSON string concatenation:

```typescript
const rewriter = new HTMLRewriter()
  .on("*", {
    element(element: Element) {
      const attrs = getAttributes(element);
      vdomStr += `{"type":"${element.tagName}", "props":{${attrs}"children": [`;
      // ...
    },
    text(text: Text) {
      if (text.text) {
        const sanitized = sanitizeJSON(text.text);
        vdomStr += `"${sanitized}",`;
      }
    }
  });
```

**Problems:**
- Building JSON via string concatenation is error-prone
- The `sanitizeJSON` function only handles basic escapes, missing edge cases
- Limited attribute support (only `style`, `src`, `width`, `height`)
- Uses `HTMLRewriter` which is Cloudflare-specific - not portable
- The code comments even acknowledge it: *"very error prone. So it might need more hardening"*

### 4. No Vite Support

**Location:** `packages/workers-og/bin/esbuild.js`

```javascript
loader: {
  ".wasm": "copy",  // WASM files copied, not bundled
}
```

**Problem:** Vite handles WASM files differently than esbuild's copy loader. Cloudflare Workers require WASM to be imported as modules, and Vite's default handling doesn't match wrangler's expectations.

The library only works with `wrangler dev`, not `vite dev` with `@cloudflare/vite-plugin`.

### 5. Style Parsing Edge Cases

**Location:** `packages/workers-og/src/parseUtils.ts:13-61`

```typescript
// Uses regex to split by semicolons
const regex = /;(?![^(]*\))/g;
```

This regex approach fails on:
- Nested parentheses: `calc(100% - (10px + 5px))`
- Data URIs with semicolons: `url(data:image/png;base64,...)`
- Complex CSS values with multiple function calls

---

## Design Decisions

### 1. Wrap @cf-wasm/og Instead of Building from Scratch

**Decision:** Use `@cf-wasm/og` as the foundation.

**Rationale:**
- WASM compatibility on Cloudflare Workers is genuinely hard
- Workers cannot compile WASM from arbitrary data blobs - must import as modules
- `yoga-wasm-web` is abandoned, Satori uses internal patches
- `@cf-wasm/og` is actively maintained (last release Dec 2025)
- Already solves Vite + Wrangler compatibility via `@cf-wasm/plugins`
- Handles yoga and resvg WASM loading correctly

**Alternative considered:** Building from scratch with `satori/standalone`. Rejected because it would require maintaining custom yoga-wasm builds.

### 2. Use htmlparser2 Instead of html-react-parser

**Decision:** Use `htmlparser2` for HTML parsing.

**Rationale:**
- `html-react-parser` uses `html-dom-parser` which detects the environment
- Cloudflare Workers is incorrectly detected as a browser environment
- This causes it to use `document.implementation.createHTMLDocument` which doesn't exist in Workers
- `htmlparser2` is a pure streaming parser with no browser dependencies
- It's the same parser that `html-react-parser` uses server-side, just accessed directly

**Error we encountered:**
```
Error: This browser does not support `document.implementation.createHTMLDocument`
```

### 3. Use style-to-js for CSS Parsing

**Decision:** Use `style-to-js` instead of custom style parsing.

**Rationale:**
- Battle-tested library (1.1M+ weekly downloads)
- Handles all edge cases: `url()`, `rgb()`, `calc()`, data URIs, vendor prefixes
- `reactCompat` option capitalizes vendor prefixes correctly for React
- Much simpler than maintaining a state-machine style parser

**Before (workers-og):**
```typescript
const regex = /;(?![^(]*\))/g;  // Fragile regex
```

**After:**
```typescript
styleToJS(styleString, { reactCompat: true })  // Robust library
```

### 4. Provide Backwards-Compatible API

**Decision:** Support both the new API and workers-og's API.

**New API (recommended):**
```typescript
import { ImageResponse, GoogleFont, cache } from 'cf-workers-og';
cache.setExecutionContext(ctx);
return ImageResponse.create(<div>...</div>, { fonts: [new GoogleFont('Inter')] });
```

**Legacy API (backwards compatible):**
```typescript
import { ImageResponse, loadGoogleFont } from 'cf-workers-og';
return new ImageResponse(element, options);  // Constructor returns Promise
```

**Rationale:** Makes migration easier for existing workers-og users.

### 5. Wrap HTML in Flex Container

**Decision:** Automatically wrap parsed HTML in a flex container.

```typescript
const wrappedHtml = `<div style="display: flex; flex-direction: column;">${html}</div>`;
```

**Rationale:**
- Satori requires a single root element
- Flex layout is the most common use case for OG images
- Matches workers-og behavior for compatibility

---

## Technical Learnings

### Cloudflare Workers WASM Loading

Workers have strict requirements:
```typescript
// ✅ Works - import as module
import yogaWasm from './yoga.wasm';

// ❌ Doesn't work - runtime compilation
const wasm = await WebAssembly.compile(buffer);
```

The `@cloudflare/vite-plugin` (GA April 2025) supports both `.wasm` and `.wasm?module` imports, bridging Vite and Wrangler.

### React in Workers

React works fine in Workers, but:
- JSX needs to be transpiled (TypeScript/esbuild handles this)
- `react/jsx-runtime` is used for the new JSX transform
- No DOM APIs available - only virtual elements for Satori

### Font Caching

`@cf-wasm/og` requires calling `cache.setExecutionContext(ctx)` to enable font caching:

```typescript
export default {
  async fetch(request, env, ctx) {
    cache.setExecutionContext(ctx);  // Required!
    // ...
  }
};
```

Without this, fonts are re-fetched on every request.

---

## Bundle Size

| Component | Size (gzipped) |
|-----------|----------------|
| cf-workers-og wrapper | ~2.3 KB |
| @cf-wasm/og (including WASM) | ~500 KB |
| **Total** | ~500 KB |

This is well under Cloudflare Workers' 10MB limit for paid plans (1MB for free).

---

## Future Considerations

1. **HTML parsing performance** - htmlparser2 is fast, but for very large HTML strings, streaming might be beneficial
2. **Custom fonts** - Currently relies on @cf-wasm/og's font handling; could add more convenience methods
3. **Error handling** - Could provide better error messages for common Satori issues (missing display:flex, etc.)
4. **Testing** - Add unit tests for HTML parsing edge cases
