/**
 * Example Cloudflare Worker using cf-workers-og
 *
 * This demonstrates both JSX and HTML string usage.
 *
 * Run with Vite:    pnpm dev
 * Run with Wrangler: pnpm dev:wrangler
 */

import { ImageResponse, GoogleFont, cache, parseHtml } from "cf-workers-og/html";

export interface Env {
  // Add your bindings here
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Required for font caching
    cache.setExecutionContext(ctx);

    const url = new URL(request.url);
    const path = url.pathname;

    // Route: /jsx - JSX-based OG image (recommended)
    if (path === "/jsx" || path === "/") {
      const title = url.searchParams.get("title") || "Hello from cf-workers-og";

      return ImageResponse.create(
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontFamily: "Inter",
          }}
        >
          <h1
            style={{
              fontSize: 60,
              margin: 0,
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 24, opacity: 0.8, marginTop: 20 }}>
            Generated with cf-workers-og
          </p>
        </div>,
        {
          width: 1200,
          height: 630,
          fonts: [new GoogleFont("Inter", { weight: 700 })],
          emoji: "twemoji",
        }
      );
    }

    // Route: /html - HTML string-based OG image
    if (path === "/html") {
      const title = url.searchParams.get("title") || "Hello from HTML";

      const html = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; font-family: Inter;">
          <h1 style="font-size: 60px; margin: 0; text-align: center; padding: 0 40px;">
            ${escapeHtml(title)}
          </h1>
          <p style="font-size: 24px; opacity: 0.8; margin-top: 20px;">
            Rendered from HTML string
          </p>
        </div>
      `;

      return ImageResponse.create(parseHtml(html), {
        width: 1200,
        height: 630,
        fonts: [new GoogleFont("Inter", { weight: 700 })],
      });
    }

    // Route: /svg - SVG format output
    if (path === "/svg") {
      return ImageResponse.create(
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#1a1a2e",
            color: "#eee",
            fontFamily: "Inter",
          }}
        >
          <h1 style={{ fontSize: 48 }}>SVG Output</h1>
        </div>,
        {
          format: "svg",
          fonts: [new GoogleFont("Inter", { weight: 700 })],
        }
      );
    }

    // Default: show usage instructions
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
  <title>cf-workers-og Example</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    a { color: #667eea; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
    img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>cf-workers-og Example</h1>
  <h2>Routes</h2>
  <ul>
    <li><a href="/jsx">/jsx</a> - JSX-based OG image (recommended)</li>
    <li><a href="/jsx?title=Custom%20Title">/jsx?title=Custom Title</a> - With custom title</li>
    <li><a href="/html">/html</a> - HTML string-based OG image</li>
    <li><a href="/svg">/svg</a> - SVG format output</li>
  </ul>
  <h2>Preview</h2>
  <img src="/jsx" alt="OG Image Preview" />
</body>
</html>
      `.trim(),
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  },
};

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
