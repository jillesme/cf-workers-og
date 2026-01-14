import { cache } from "./cache";
import type { FontStyle, FontWeight, GoogleFontOptions } from "./types";

type FontData = ArrayBuffer | ArrayBufferView;

/**
 * Load a Google Font and return its data as an ArrayBuffer.
 *
 * This is a backwards-compatible function for users migrating from workers-og.
 * For new code, prefer using the `GoogleFont` class.
 */
export async function loadGoogleFont(
  options: GoogleFontOptions
): Promise<ArrayBuffer> {
  const { family, weight, text } = options;

  const params: Record<string, string> = {
    family: `${encodeURIComponent(family)}${weight ? `:wght@${weight}` : ""}`,
  };

  if (text) {
    params.text = text;
  } else {
    params.subset = "latin";
  }

  const cssUrl = `https://fonts.googleapis.com/css2?${Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&")}`;

  const cfCache =
    typeof caches !== "undefined"
      ? (caches as unknown as { default: Cache }).default
      : undefined;

  let cssResponse: Response | undefined;

  if (cfCache) {
    cssResponse = await cfCache.match(cssUrl);
  }

  if (!cssResponse) {
    cssResponse = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    });

    if (cfCache) {
      const cacheResponse = new Response(cssResponse.body, cssResponse);
      cacheResponse.headers.set("Cache-Control", "s-maxage=3600");
      const putPromise = cfCache.put(cssUrl, cacheResponse.clone());
      cache.waitUntil(putPromise);
      await putPromise;
      cssResponse = cacheResponse;
    }
  }

  const css = await cssResponse.text();

  const fontUrlMatch = css.match(
    /src: url\(([^)]+)\) format\(['"]?(opentype|truetype|woff2?|woff)['"]?\)/
  );

  if (!fontUrlMatch?.[1]) {
    throw new Error(
      `Could not find font URL for "${family}" (weight: ${weight ?? "default"})`
    );
  }

  const fontUrl = fontUrlMatch[1].replace(/['"]/g, "");
  const fontResponse = await fetch(fontUrl);
  return fontResponse.arrayBuffer();
}

export class GoogleFont {
  name: string;
  data: Promise<ArrayBuffer>;
  weight?: FontWeight;
  style?: FontStyle;

  constructor(
    family: string,
    options: { weight?: FontWeight; style?: FontStyle; text?: string } = {}
  ) {
    this.name = family;
    this.weight = options.weight;
    this.style = options.style;
    this.data = loadGoogleFont({
      family,
      weight: options.weight,
      text: options.text,
    });
  }
}

export class CustomFont {
  name: string;
  data: FontData | Promise<FontData>;
  weight?: FontWeight;
  style?: FontStyle;

  constructor(
    name: string,
    data: FontData | Promise<FontData>,
    options: { weight?: FontWeight; style?: FontStyle } = {}
  ) {
    this.name = name;
    this.data = data;
    this.weight = options.weight;
    this.style = options.style;
  }
}

/**
 * Create a font configuration object for ImageResponse.
 */
export function createFontConfig(
  name: string,
  data: ArrayBuffer,
  weight: FontWeight = 400,
  style: "normal" | "italic" = "normal"
) {
  return {
    name,
    data,
    weight,
    style,
  };
}
