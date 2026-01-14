/**
 * cf-workers-og (HTML entry point)
 *
 * Includes HTML string parsing support without legacy constructor behavior.
 */

import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { parseHtml } from "./html-parser";
import { renderPng, renderSvg } from "./runtime/satori.workerd";
import { cache } from "./cache";

export { cache };

export const ImageResponse = createImageResponseClass<ReactNode | string>({
  renderSvg,
  renderPng,
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
