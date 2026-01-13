/**
 * cf-workers-og (Node.js HTML entry point)
 */

import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { parseHtml } from "./html-parser";
import { renderSvg } from "./runtime/satori.node";
import { cache } from "./cache";

export { cache };

export const ImageResponse = createImageResponseClass<ReactNode | string>({
  renderSvg,
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
