import { parseDocument } from "htmlparser2";
import { createElement, type ReactNode } from "react";
import styleToJS from "style-to-js";

/**
 * Parse an HTML string into React elements compatible with Satori.
 *
 * This uses htmlparser2 for server-side DOM parsing (works in Cloudflare Workers),
 * and transforms HTML attributes to React props (style strings to objects, etc.)
 *
 * @param html - HTML string to parse
 * @returns React node tree compatible with Satori
 *
 * @example
 * ```typescript
 * const element = parseHtml('<div style="display: flex; color: white;">Hello</div>');
 * return ImageResponse.create(element, { width: 1200, height: 630 });
 * ```
 */
export function parseHtml(html: string): ReactNode {
  // Wrap in a flex container to ensure single root and proper layout
  const wrappedHtml = `<div style="display: flex; flex-direction: column;">${html}</div>`;

  // Parse HTML to DOM tree
  const doc = parseDocument(wrappedHtml);

  // Convert first child (our wrapper div)
  const rootNode = doc.childNodes[0];
  if (!rootNode) {
    return null;
  }

  return convertNode(rootNode);
}

/**
 * Convert a DOM node to a React element
 */
function convertNode(node: Node): ReactNode {
  // Text node
  if (node.type === "text") {
    const textNode = node as TextNode;
    const text = textNode.data.trim();
    return text || null;
  }

  // Element node
  if (node.type === "tag") {
    const element = node as ElementNode;
    const tagName = element.name.toLowerCase();

    // Build React props from HTML attributes
    const props: Record<string, unknown> = {};

    // Convert style string to object using style-to-js
    if (element.attribs.style) {
      props.style = styleToJS(element.attribs.style, { reactCompat: true });
    }

    // Map class to className
    if (element.attribs.class) {
      props.className = element.attribs.class;
    }

    // Copy other attributes, converting to React naming conventions
    for (const [key, value] of Object.entries(element.attribs)) {
      if (key === "style" || key === "class") continue;

      // Convert HTML attribute names to React prop names
      const reactKey = htmlAttrToReactProp(key);
      props[reactKey] = value;
    }

    // Handle image src specially - Satori requires width/height
    if (tagName === "img" && props.src) {
      if (!props.width) {
        console.warn(
          "cf-workers-og: <img> elements should have explicit width for Satori"
        );
      }
      if (!props.height) {
        console.warn(
          "cf-workers-og: <img> elements should have explicit height for Satori"
        );
      }
    }

    // Recursively convert children
    const children = (element.children || [])
      .map(convertNode)
      .filter((child): child is ReactNode => child !== null);

    return createElement(tagName, props, ...children);
  }

  // Other node types (comments, etc.) - skip
  return null;
}

/**
 * Convert HTML attribute name to React prop name
 */
function htmlAttrToReactProp(attr: string): string {
  // Common mappings
  const mappings: Record<string, string> = {
    class: "className",
    for: "htmlFor",
    tabindex: "tabIndex",
    readonly: "readOnly",
    maxlength: "maxLength",
    cellspacing: "cellSpacing",
    cellpadding: "cellPadding",
    rowspan: "rowSpan",
    colspan: "colSpan",
    usemap: "useMap",
    frameborder: "frameBorder",
    contenteditable: "contentEditable",
    crossorigin: "crossOrigin",
    srcset: "srcSet",
    srcdoc: "srcDoc",
  };

  if (mappings[attr]) {
    return mappings[attr];
  }

  // Convert data-* and aria-* attributes (keep as-is in React)
  if (attr.startsWith("data-") || attr.startsWith("aria-")) {
    return attr;
  }

  // Convert kebab-case to camelCase for other attributes
  return attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

// Type definitions for htmlparser2 nodes
interface Node {
  type: string;
}

interface TextNode extends Node {
  type: "text";
  data: string;
}

interface ElementNode extends Node {
  type: "tag";
  name: string;
  attribs: Record<string, string>;
  children: Node[];
}
