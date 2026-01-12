/**
 * cf-workers-og (HTML entry point)
 *
 * Includes HTML string parsing support without legacy constructor behavior.
 */

import { ImageResponse as CfImageResponse } from "@cf-wasm/og/workerd";
import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { parseHtml } from "./html-parser";

export { cache } from "@cf-wasm/og/workerd";

export const ImageResponse = createImageResponseClass<ReactNode | string>({
  cfImageResponse: CfImageResponse,
  parseHtml,
});

export { parseHtml } from "./html-parser";

export { GoogleFont, CustomFont, loadGoogleFont, createFontConfig } from "./fonts";

export type {
  ImageResponseOptions,
  FontConfig,
  FontWeight,
  FontStyle,
  EmojiType,
  GoogleFontOptions,
} from "./types";
