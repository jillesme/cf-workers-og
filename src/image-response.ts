import { ImageResponse as CfImageResponse } from "@cf-wasm/og/workerd";
import type { ReactNode } from "react";
import { createImageResponseClass } from "./core/image-response";

export { cache } from "@cf-wasm/og/workerd";

export const ImageResponse = createImageResponseClass<ReactNode>({
  cfImageResponse: CfImageResponse,
});
