/**
 * cf-workers-og (Node.js HTML entry point)
 */

import { ImageResponse as CfImageResponse } from "@cf-wasm/og/node";
import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { parseHtml } from "./html-parser";

export { cache } from "@cf-wasm/og/node";

export const ImageResponse = createImageResponseClass<ReactNode | string>({
  cfImageResponse: CfImageResponse,
  parseHtml,
});

export { parseHtml } from "./html-parser";

export { GoogleFont, CustomFont, loadGoogleFont, createFontConfig } from "./fonts.node";

export type {
  ImageResponseOptions,
  FontConfig,
  FontWeight,
  FontStyle,
  EmojiType,
  GoogleFontOptions,
} from "./types";
