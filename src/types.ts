/**
 * Emoji provider options for rendering emoji in OG images
 */
export type EmojiType =
  | "twemoji"
  | "openmoji"
  | "blobmoji"
  | "noto"
  | "fluent"
  | "fluentFlat";

/**
 * Font weight options
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Font style options
 */
export type FontStyle = "normal" | "italic";

/**
 * Font configuration for manually loaded fonts
 */
export interface FontConfig {
  name: string;
  data: ArrayBuffer | ArrayBufferView;
  weight?: FontWeight;
  style?: FontStyle;
}

/**
 * Font configuration with async data loading (used by GoogleFont/CustomFont classes)
 */
export interface AsyncFontConfig {
  name: string;
  data:
    | ArrayBuffer
    | ArrayBufferView
    | Promise<ArrayBuffer | ArrayBufferView>;
  weight?: FontWeight;
  style?: FontStyle;
}

/**
 * Union type for all supported font configurations
 */
export type FontInput = FontConfig | AsyncFontConfig;

/**
 * Options for ImageResponse
 */
export interface ImageResponseOptions {
  /**
   * Width of the output image in pixels
   * @default 1200
   */
  width?: number;

  /**
   * Height of the output image in pixels
   * @default 630
   */
  height?: number;

  /**
   * Output format
   * @default "png"
   */
  format?: "png" | "svg";

  /**
   * Fonts to use for rendering text.
   * Accepts FontConfig (manual loading) or GoogleFont/CustomFont classes.
   */
  fonts?: FontInput[];

  /**
   * Emoji provider for rendering emoji
   */
  emoji?: EmojiType;

  /**
   * Enable debug mode (disables caching)
   * @default false
   */
  debug?: boolean;

  /**
   * Additional headers to include in the response
   */
  headers?: Record<string, string>;

  /**
   * HTTP status code for the response
   * @default 200
   */
  status?: number;

  /**
   * HTTP status text for the response
   */
  statusText?: string;
}

/**
 * Options for loading Google Fonts
 */
export interface GoogleFontOptions {
  /**
   * Font family name (e.g., "Inter", "Roboto")
   */
  family: string;

  /**
   * Font weight
   * @default 400
   */
  weight?: FontWeight;

  /**
   * Subset of characters to load (for optimization)
   */
  text?: string;
}
