import type { ReactNode } from "react";
import type { FontInput, ImageResponseOptions } from "../types";
import type { Font, SatoriOptions } from "satori/standalone";

type ParseHtml = (html: string) => ReactNode;

type CreateImageResponseConfig = {
  renderSvg: (element: ReactNode, options: SatoriOptions) => Promise<string>;
  renderPng?: (element: ReactNode, options: SatoriOptions) => Promise<Uint8Array>;
  parseHtml?: ParseHtml;
};

type ImageInput = ReactNode | string;

export type ImageResponseClass<Input extends ImageInput> = {
  create(element: Input, options?: ImageResponseOptions): Promise<Response>;
};

export function createImageResponseClass<Input extends ImageInput>(
  config: CreateImageResponseConfig
): ImageResponseClass<Input> {
  const { renderSvg, renderPng, parseHtml } = config;

  class ImageResponseCore {
    static async create(
      element: Input,
      options: ImageResponseOptions = {}
    ): Promise<Response> {
      const reactElement = resolveElement(element, parseHtml);
      const normalized = normalizeOptions(options);

      const satoriOptions = {
        width: normalized.width,
        height: normalized.height,
        fonts: await resolveFonts(normalized.fonts),
        debug: normalized.debug,
      };

      let body: string | Uint8Array;
      if (normalized.format === "svg") {
        body = await renderSvg(reactElement, satoriOptions);
      } else if (renderPng) {
        body = await renderPng(reactElement, satoriOptions);
      } else {
        throw new Error(
          "cf-workers-og: PNG output is not supported in this runtime"
        );
      }

      const responseHeaders = buildResponseHeaders(
        new Headers(),
        normalized.format,
        normalized.debug,
        normalized.headers
      );

      return new Response(body, {
        headers: responseHeaders,
        status: normalized.status,
        statusText: normalized.statusText,
      });
    }
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
        "cf-workers-og: HTML string input requires cf-workers-og/html"
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
    format: options.format ?? "png",
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
