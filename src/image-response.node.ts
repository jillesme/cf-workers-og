import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { renderPng, renderSvg } from "./runtime/satori.node";
import { cache } from "./cache";

export { cache };

export const ImageResponse = createImageResponseClass<ReactNode>({
  renderSvg,
  renderPng,
});
