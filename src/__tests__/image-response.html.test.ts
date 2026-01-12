import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { ImageResponse } from "../html";

describe("ImageResponse (html)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept HTML strings via create()", async () => {
    const response = await ImageResponse.create(
      '<div style="display: flex;">HTML</div>'
    );

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("should discourage constructor usage", () => {
    expect(() => new ImageResponse("<div>HTML</div>")).toThrow(
      "cf-workers-og: use ImageResponse.create"
    );
  });
});
