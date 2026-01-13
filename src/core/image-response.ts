import type { ReactNode } from "react";
import type { FontInput, ImageResponseOptions } from "../types";
import type { Font, SatoriOptions } from "satori/standalone";

type ParseHtml = (html: string) => ReactNode;

type CreateImageResponseConfig = {
  renderSvg: (element: ReactNode, options: SatoriOptions) => Promise<string>;
  parseHtml?: ParseHtml;
  compatConstructor?: boolean;
};

type ImageInput = ReactNode | string;

export type ImageResponseClass<Input extends ImageInput> = {
  new (element: Input, options?: ImageResponseOptions): Response;
  create(element: Input, options?: ImageResponseOptions): Promise<Response>;
};

export type ImageResponseCompatClass<Input extends ImageInput> = {
  new (element: Input, options?: ImageResponseOptions): Promise<Response>;
  create(element: Input, options?: ImageResponseOptions): Promise<Response>;
};

export function createImageResponseClass<Input extends ImageInput>(
  config: CreateImageResponseConfig & { compatConstructor: true }
): ImageResponseCompatClass<Input>;
export function createImageResponseClass<Input extends ImageInput>(
  config: CreateImageResponseConfig & { compatConstructor?: false }
): ImageResponseClass<Input>;
export function createImageResponseClass<Input extends ImageInput>(
  config: CreateImageResponseConfig
): ImageResponseClass<Input> | ImageResponseCompatClass<Input> {
  const { renderSvg, parseHtml, compatConstructor = false } = config;

  class ImageResponseCore extends Response {
    static async create(
      element: Input,
      options: ImageResponseOptions = {}
    ): Promise<Response> {
      const reactElement = resolveElement(element, parseHtml);
      const normalized = normalizeOptions(options);

      if (normalized.format !== "svg") {
        throw new Error(
          "cf-workers-og: PNG output is not supported yet; use format: \"svg\""
        );
      }

      const svg = await renderSvg(reactElement, {
        width: normalized.width,
        height: normalized.height,
        fonts: await resolveFonts(normalized.fonts),
        debug: normalized.debug,
      });

      const responseHeaders = buildResponseHeaders(
        new Headers(),
        normalized.format,
        normalized.debug,
        normalized.headers
      );

      return new Response(svg, {
        headers: responseHeaders,
        status: normalized.status,
        statusText: normalized.statusText,
      });
    }

    constructor(element: Input, options: ImageResponseOptions = {}) {
      super(null);
      if (!compatConstructor) {
        throw new Error(
          "cf-workers-og: use ImageResponse.create(...) or import from cf-workers-og/compat"
        );
      }
      return ImageResponseCore.create(element, options) as unknown as ImageResponseCore;
    }
  }

  if (compatConstructor) {
    // Cast through unknown to model legacy workers-og constructor behavior.
    // The runtime returns a Promise, but TS cannot express that on classes.
    return ImageResponseCore as unknown as ImageResponseCompatClass<Input>;
  }

  return ImageResponseCore as ImageResponseClass<Input>;
}

function resolveElement<Input extends ImageInput>(
  element: Input,
  parseHtml?: ParseHtml
): ReactNode {
  if (typeof element === "string") {
    if (!parseHtml) {
      throw new Error(
        "cf-workers-og: HTML string input requires cf-workers-og/html or cf-workers-og/compat"
      );
    }
    return parseHtml(element);
  }

  return element;
}

function normalizeOptions(options: ImageResponseOptions) {
  return {
    width: options.width ?? 1200,
    height: options.height ?? 630,
    format: options.format ?? "svg",
    fonts: options.fonts ?? [],
    debug: options.debug ?? false,
    headers: options.headers ?? {},
    status: options.status ?? 200,
    statusText: options.statusText,
  };
}

function buildResponseHeaders(
  baseHeaders: Headers,
  format: "png" | "svg",
  debug: boolean,
  customHeaders: Record<string, string>
): Headers {
  const responseHeaders = new Headers(baseHeaders);

  responseHeaders.set(
    "Content-Type",
    format === "svg" ? "image/svg+xml" : "image/png"
  );

  responseHeaders.set(
    "Cache-Control",
    debug
      ? "no-cache, no-store"
      : "public, immutable, no-transform, max-age=31536000"
  );

  for (const [key, value] of Object.entries(customHeaders)) {
    responseHeaders.set(key, value);
  }

  return responseHeaders;
}

async function resolveFonts(fonts: FontInput[]): Promise<Font[]> {
  const resolvedFonts: Font[] = [];

  for (const font of fonts) {
    const data = await Promise.resolve(font.data);
    resolvedFonts.push({
      name: font.name,
      data: normalizeFontData(data),
      weight: font.weight,
      style: font.style,
    });
  }

  return resolvedFonts;
}

function normalizeFontData(data: ArrayBuffer | ArrayBufferView) {
  const bufferCtor = (globalThis as { Buffer?: { isBuffer?: (value: unknown) => boolean } })
    .Buffer;
  if (bufferCtor?.isBuffer?.(data)) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return data;
  }

  const { buffer, byteOffset, byteLength } = data;
  return buffer.slice(byteOffset, byteOffset + byteLength);
}
