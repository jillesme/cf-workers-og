import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

vi.mock("../runtime/satori.workerd", () => ({
  renderSvg: vi.fn().mockResolvedValue("<svg></svg>"),
  renderPng: vi.fn().mockResolvedValue(new Uint8Array([1])),
}));

import { ImageResponse, cache } from "../compat";

describe("ImageResponse (compat)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept HTML strings via create()", async () => {
    const response = await ImageResponse.create(
      '<div style="display: flex;">Compat</div>'
    );

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
  });

  it("should support constructor compatibility", async () => {
    const element = createElement("div", {}, "Compat");
    const response = new ImageResponse(element);

    expect(response).toBeInstanceOf(Promise);
    const resolved = await response;
    expect(resolved).toBeInstanceOf(Response);
  });

  it("should export cache utilities", () => {
    expect(cache).toBeDefined();
    expect(cache.setExecutionContext).toBeDefined();
  });
});
