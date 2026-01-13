import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

vi.mock("../runtime/satori.node", () => ({
  renderSvg: vi.fn().mockResolvedValue("<svg></svg>"),
}));

import { ImageResponse } from "../image-response.node";

describe("ImageResponse (node)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a Response with SVG content type by default", async () => {
    const element = createElement("div", {}, "Test");
    const response = await ImageResponse.create(element);

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
  });

  it("should use default width and height", async () => {
    const { renderSvg } = await import("../runtime/satori.node");
    const element = createElement("div", {}, "Test");

    await ImageResponse.create(element);

    expect(renderSvg).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ width: 1200, height: 630 })
    );
  });

  it("should throw when HTML strings are provided", async () => {
    await expect(ImageResponse.create("<div>Node</div>")).rejects.toThrow(
      "cf-workers-og: HTML string input requires"
    );
  });
});
