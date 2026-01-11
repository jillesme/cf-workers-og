/**
 * cf-workers-og
 *
 * Generate Open Graph images on Cloudflare Workers with Vite support.
 *
 * @example
 * ```tsx
 * import { ImageResponse, GoogleFont, cache } from 'cf-workers-og';
 *
 * export default {
 *   async fetch(request, env, ctx) {
 *     cache.setExecutionContext(ctx);
 *
 *     return ImageResponse.create(
 *       <div style={{ display: 'flex', background: '#000', color: '#fff' }}>
 *         <h1>Hello World</h1>
 *       </div>,
 *       {
 *         width: 1200,
 *         height: 630,
 *         fonts: [new GoogleFont('Inter', { weight: 700 })],
 *       }
 *     );
 *   }
 * };
 * ```
 *
 * @packageDocumentation
 */

// Core exports
export { ImageResponse, cache } from "./image-response";
export { parseHtml } from "./html-parser";

// Font utilities
export { GoogleFont, CustomFont, loadGoogleFont, createFontConfig } from "./fonts";

// Types
export type {
  ImageResponseOptions,
  FontConfig,
  FontWeight,
  FontStyle,
  EmojiType,
  GoogleFontOptions,
} from "./types";
