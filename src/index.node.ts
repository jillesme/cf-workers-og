/**
 * cf-workers-og (Node.js entry point)
 *
 * This entry point is used when running in Node.js environments (e.g., Astro dev server).
 * It loads the vendored Yoga WASM from disk for Satori initialization.
 *
 * @packageDocumentation
 */

// Core exports (using Node.js-compatible imports)
export { ImageResponse, cache } from "./image-response.node";

// Font utilities (using Node.js-compatible imports)
export { GoogleFont, CustomFont, loadGoogleFont, createFontConfig } from "./fonts.node";

// Types
export type {
  ImageResponseOptions,
  FontConfig,
  FontWeight,
  FontStyle,
  EmojiType,
  GoogleFontOptions,
} from "./types";
