import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

vi.mock("@cf-wasm/og/node", () => ({
  ImageResponse: {
    async: vi.fn().mockResolvedValue({
      body: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      headers: new Headers(),
    }),
  },
  cache: {
    setExecutionContext: vi.fn(),
  },
}));

import { ImageResponse } from "../image-response.node";

describe("ImageResponse (node)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a Response with PNG content type by default", async () => {
    const element = createElement("div", {}, "Test");
    const response = await ImageResponse.create(element);

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("should use default width and height", async () => {
    const { ImageResponse: MockedCfImageResponse } = await import("@cf-wasm/og/node");
    const element = createElement("div", {}, "Test");

    await ImageResponse.create(element);

    expect(MockedCfImageResponse.async).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        width: 1200,
        height: 630,
      })
    );
  });

  it("should throw when HTML strings are provided", async () => {
    await expect(ImageResponse.create("<div>Node</div>")).rejects.toThrow(
      "cf-workers-og: HTML string input requires"
    );
  });
});
