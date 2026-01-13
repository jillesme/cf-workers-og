import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";
import { renderSvg } from "./runtime/satori.workerd";
import { cache } from "./cache";

export { cache };

export const ImageResponse = createImageResponseClass<ReactNode>({
  renderSvg,
});
