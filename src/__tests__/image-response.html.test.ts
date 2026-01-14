import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../runtime/satori.workerd", () => ({
  renderSvg: vi.fn().mockResolvedValue("<svg></svg>"),
  renderPng: vi.fn().mockResolvedValue(new Uint8Array([1])),
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

});
