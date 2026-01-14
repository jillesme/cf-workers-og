declare module "satori/standalone" {
  import type { ReactNode } from "react";

  export interface Font {
    name: string;
    data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView;
    weight?: number;
    style?: "normal" | "italic" | string;
    lang?: string;
  }

  export interface SatoriOptions {
    width: number;
    height: number;
    fonts: Font[];
    debug?: boolean;
    [key: string]: unknown;
  }

  const satori: (
    element: ReactNode,
    options: SatoriOptions
  ) => string | Promise<string>;

  export default satori;

  export function init(
    yoga:
      | ArrayBuffer
      | SharedArrayBuffer
      | ArrayBufferView
      | WebAssembly.Module
      | WebAssembly.Instance
  ): Promise<void>;
}
