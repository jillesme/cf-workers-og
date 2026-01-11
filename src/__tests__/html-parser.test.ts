import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseHtml } from "../html-parser";
import { isValidElement, type ReactElement } from "react";

describe("parseHtml", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("basic parsing", () => {
    it("should parse simple HTML with text", () => {
      const result = parseHtml("<div>Hello</div>");

      expect(result).toBeDefined();
      expect(isValidElement(result)).toBe(true);
    });

    it("should return wrapper div for empty HTML", () => {
      const result = parseHtml("");

      expect(result).toBeDefined();
      expect(isValidElement(result)).toBe(true);
    });

    it("should parse nested elements", () => {
      const result = parseHtml("<div><span>Nested</span></div>") as ReactElement;

      expect(result).toBeDefined();
      expect(result.props.children).toBeDefined();
    });

    it("should parse multiple sibling elements", () => {
      const result = parseHtml("<div>First</div><div>Second</div>") as ReactElement;

      expect(result).toBeDefined();
      // Should be wrapped in a flex container
      expect(Array.isArray(result.props.children)).toBe(true);
    });
  });

  describe("style parsing", () => {
    it("should convert style strings to React style objects", () => {
      const result = parseHtml(
        '<div style="display: flex; color: red;">Test</div>'
      ) as ReactElement;

      expect(result).toBeDefined();
      // The wrapper div has the flex styles, inner div should have our styles
      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props.style).toEqual({
        display: "flex",
        color: "red",
      });
    });

    it("should handle complex CSS values", () => {
      const result = parseHtml(
        '<div style="background: linear-gradient(to right, #000, #fff);">Test</div>'
      ) as ReactElement;

      expect(result).toBeDefined();
      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props.style.background).toBe(
        "linear-gradient(to right, #000, #fff)"
      );
    });

    it("should handle multiple style properties", () => {
      const result = parseHtml(
        '<div style="width: 100px; height: 50px; padding: 10px;">Test</div>'
      ) as ReactElement;

      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props.style).toEqual({
        width: "100px",
        height: "50px",
        padding: "10px",
      });
    });
  });

  describe("attribute conversion", () => {
    it("should convert class to className", () => {
      const result = parseHtml('<div class="test-class">Test</div>') as ReactElement;

      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props.className).toBe("test-class");
    });

    it("should preserve data-* attributes", () => {
      const result = parseHtml('<div data-testid="my-test">Test</div>') as ReactElement;

      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props["data-testid"]).toBe("my-test");
    });

    it("should preserve aria-* attributes", () => {
      const result = parseHtml('<div aria-label="My Label">Test</div>') as ReactElement;

      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props["aria-label"]).toBe("My Label");
    });

    it("should convert tabindex to tabIndex", () => {
      const result = parseHtml('<div tabindex="0">Test</div>') as ReactElement;

      const innerDiv = result.props.children as ReactElement;
      expect(innerDiv.props.tabIndex).toBe("0");
    });
  });

  describe("image handling", () => {
    it("should warn for img without width", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      parseHtml('<img src="test.png" height="100" />');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("width")
      );
    });

    it("should warn for img without height", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      parseHtml('<img src="test.png" width="100" />');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("height")
      );
    });

    it("should not warn for img with both dimensions", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      parseHtml('<img src="test.png" width="100" height="100" />');

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("text handling", () => {
    it("should preserve text content", () => {
      const result = parseHtml("<p>Hello World</p>") as ReactElement;

      const innerP = result.props.children as ReactElement;
      expect(innerP.props.children).toContain("Hello World");
    });

    it("should trim whitespace from text nodes", () => {
      const result = parseHtml("<p>   Trimmed   </p>") as ReactElement;

      const innerP = result.props.children as ReactElement;
      expect(innerP.props.children).toContain("Trimmed");
    });

    it("should handle mixed text and elements", () => {
      const result = parseHtml("<div>Text <span>nested</span> more</div>") as ReactElement;

      expect(result).toBeDefined();
    });
  });

  describe("wrapper behavior", () => {
    it("should wrap content in a flex column container", () => {
      const result = parseHtml("<div>Test</div>") as ReactElement;

      expect(result.type).toBe("div");
      expect(result.props.style).toEqual({
        display: "flex",
        flexDirection: "column",
      });
    });
  });
});
