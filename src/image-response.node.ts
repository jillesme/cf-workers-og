import { ImageResponse as CfImageResponse } from "@cf-wasm/og/node";
import type { ReactNode } from "react";
import { parseHtml } from "./html-parser";
import type { ImageResponseOptions } from "./types";

// Re-export cache from @cf-wasm/og for font caching
export { cache } from "@cf-wasm/og/node";

/**
 * Generate an OG image Response from a React element or HTML string.
 *
 * This is a wrapper around @cf-wasm/og that provides:
 * - Backwards compatibility with workers-og API
 * - HTML string parsing support
 * - Simplified options interface
 *
 * @example JSX usage (recommended):
 * ```tsx
 * import { ImageResponse, cache } from 'cf-workers-og';
 *
 * export default {
 *   async fetch(request, env, ctx) {
 *     cache.setExecutionContext(ctx);
 *
 *     return ImageResponse.create(
 *       <div style={{ display: 'flex', background: '#000' }}>
 *         <h1 style={{ color: 'white' }}>Hello World</h1>
 *       </div>,
 *       { width: 1200, height: 630 }
 *     );
 *   }
 * };
 * ```
 *
 * @example HTML string usage:
 * ```typescript
 * import { ImageResponse, parseHtml } from 'cf-workers-og';
 *
 * const html = '<div style="display: flex;"><h1>Hello</h1></div>';
 * return ImageResponse.create(parseHtml(html), options);
 * ```
 */
export class ImageResponse extends Response {
  /**
   * Create an OG image Response (async, recommended).
   *
   * @param element - React element or HTML string to render
   * @param options - Image generation options
   * @returns Promise<Response> with the generated image
   */
  static async create(
    element: ReactNode | string,
    options: ImageResponseOptions = {}
  ): Promise<Response> {
    // Parse HTML strings
    const reactElement =
      typeof element === "string" ? parseHtml(element) : element;

    const {
      width = 1200,
      height = 630,
      format = "png",
      fonts,
      emoji,
      debug = false,
      headers = {},
      status = 200,
      statusText,
    } = options;

    // Use @cf-wasm/og to generate the image
    // Note: @cf-wasm/og/node requires fonts to be an array, not undefined
    const response = await CfImageResponse.async(reactElement, {
      width,
      height,
      format,
      fonts: fonts ?? [],
      emoji,
    });

    // Build response headers
    const responseHeaders = new Headers(response.headers);

    // Set content type
    responseHeaders.set(
      "Content-Type",
      format === "svg" ? "image/svg+xml" : "image/png"
    );

    // Set cache headers
    responseHeaders.set(
      "Cache-Control",
      debug
        ? "no-cache, no-store"
        : "public, immutable, no-transform, max-age=31536000"
    );

    // Apply custom headers
    for (const [key, value] of Object.entries(headers)) {
      responseHeaders.set(key, value);
    }

    return new Response(response.body, {
      headers: responseHeaders,
      status,
      statusText,
    });
  }

  /**
   * Constructor for backwards compatibility with workers-og.
   *
   * Note: This returns a Promise, not an ImageResponse instance.
   * For TypeScript, use `ImageResponse.create()` instead.
   *
   * @param element - React element or HTML string to render
   * @param options - Image generation options
   * @returns Response (via Promise trick for constructor)
   *
   * @example
   * ```typescript
   * // Works like old workers-og
   * return new ImageResponse(element, options);
   * ```
   */
  constructor(element: ReactNode | string, options: ImageResponseOptions = {}) {
    // Must call super() since we extend Response
    super(null);
    // Return a Promise from the constructor (workers-og pattern)
    // This hack allows `new ImageResponse()` to work like workers-og
    return ImageResponse.create(element, options) as unknown as ImageResponse;
  }
}
