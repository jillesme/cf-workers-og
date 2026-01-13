import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

vi.mock("../runtime/satori.workerd", () => ({
  renderSvg: vi.fn().mockResolvedValue("<svg></svg>"),
}));

import { ImageResponse, cache } from "../image-response";

describe("ImageResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ImageResponse.create()", () => {
    it("should create a Response with SVG content type by default", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    });

    it("should create SVG response when format is svg", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element, { format: "svg" });

      expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    });

    it("should throw when format is png", async () => {
      const element = createElement("div", {}, "Test");

      await expect(
        ImageResponse.create(element, { format: "png" })
      ).rejects.toThrow("PNG output is not supported yet");
    });

    it("should set cache headers by default", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element);

      expect(response.headers.get("Cache-Control")).toBe(
        "public, immutable, no-transform, max-age=31536000"
      );
    });

    it("should disable caching in debug mode", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element, { debug: true });

      expect(response.headers.get("Cache-Control")).toBe("no-cache, no-store");
    });

    it("should accept custom headers", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element, {
        headers: { "X-Custom-Header": "test-value" },
      });

      expect(response.headers.get("X-Custom-Header")).toBe("test-value");
    });

    it("should use default width and height", async () => {
      const { renderSvg } = await import("../runtime/satori.workerd");
      const element = createElement("div", {}, "Test");

      await ImageResponse.create(element);

      expect(renderSvg).toHaveBeenCalledWith(
        element,
        expect.objectContaining({ width: 1200, height: 630 })
      );
    });

    it("should accept custom width and height", async () => {
      const { renderSvg } = await import("../runtime/satori.workerd");
      const element = createElement("div", {}, "Test");

      await ImageResponse.create(element, { width: 800, height: 400 });

      expect(renderSvg).toHaveBeenCalledWith(
        element,
        expect.objectContaining({ width: 800, height: 400 })
      );
    });

    it("should set custom status code", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element, { status: 201 });

      expect(response.status).toBe(201);
    });

    it("should set custom status text", async () => {
      const element = createElement("div", {}, "Test");
      const response = await ImageResponse.create(element, {
        status: 201,
        statusText: "Created",
      });

      expect(response.statusText).toBe("Created");
    });
  });

  describe("HTML string input", () => {
    it("should throw when HTML strings are provided", async () => {
      await expect(
        ImageResponse.create('<div style="display: flex;">Test</div>')
      ).rejects.toThrow("cf-workers-og: HTML string input requires");
    });
  });

  describe("constructor usage", () => {
    it("should throw to discourage constructor usage", () => {
      const element = createElement("div", {}, "Test");

      expect(() => new ImageResponse(element)).toThrow(
        "cf-workers-og: use ImageResponse.create"
      );
    });
  });

  describe("cache export", () => {
    it("should export cache utilities", () => {
      expect(cache).toBeDefined();
      expect(cache.setExecutionContext).toBeDefined();
    });
  });
});
