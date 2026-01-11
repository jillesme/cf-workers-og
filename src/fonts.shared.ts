import type { FontWeight, GoogleFontOptions } from "./types";

/**
 * Load a Google Font and return its data as an ArrayBuffer.
 *
 * This is a backwards-compatible function for users migrating from workers-og.
 * For new code, prefer using `GoogleFont` class from `@cf-wasm/og`.
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
      await cfCache.put(cssUrl, cacheResponse.clone());
      cssResponse = cacheResponse;
    }
  }

  const css = await cssResponse.text();

  const fontUrlMatch = css.match(
    /src: url\(([^)]+)\) format\(['"]?(opentype|truetype)['"]?\)/
  );

  if (!fontUrlMatch?.[1]) {
    throw new Error(
      `Could not find font URL for "${family}" (weight: ${weight ?? "default"})`
    );
  }

  const fontUrl = fontUrlMatch[1];
  const fontResponse = await fetch(fontUrl);
  return fontResponse.arrayBuffer();
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
