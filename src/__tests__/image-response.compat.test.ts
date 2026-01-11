import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

vi.mock("@cf-wasm/og/workerd", () => ({
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
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("should support constructor compatibility", async () => {
    const element = createElement("div", {}, "Compat");
    const response = new ImageResponse(element);

    expect(response).toBeInstanceOf(Promise);
    const resolved = await response;
    expect(resolved).toBeInstanceOf(Response);
  });

  it("should export cache from @cf-wasm/og", () => {
    expect(cache).toBeDefined();
    expect(cache.setExecutionContext).toBeDefined();
  });
});
