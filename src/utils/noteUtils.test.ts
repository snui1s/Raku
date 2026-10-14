import { describe, it, expect } from "vitest";
import { extractTitle, hasTextContent, findOrphanImages } from "./noteUtils";

const doc = (text: string) =>
  JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

describe("extractTitle", () => {
  it("uses the first text node", () => {
    expect(extractTitle(doc("Hello world"))).toBe("Hello world");
  });
  it("truncates to 50 chars", () => {
    expect(extractTitle(doc("a".repeat(80)))).toHaveLength(50);
  });
  it("falls back to Untitled for empty, blank or invalid content", () => {
    expect(extractTitle("")).toBe("Untitled");
    expect(extractTitle("not json")).toBe("Untitled");
    expect(extractTitle(doc("   "))).toBe("Untitled");
  });
  it("supports Thai text", () => {
    expect(extractTitle(doc("สวัสดี"))).toBe("สวัสดี");
  });
});

describe("hasTextContent", () => {
  it("detects nested text", () => {
    expect(hasTextContent(doc("x"))).toBe(true);
  });
  it("is false for whitespace, empty docs and invalid JSON", () => {
    expect(hasTextContent(doc("  "))).toBe(false);
    expect(hasTextContent('{"type":"doc","content":[{"type":"paragraph"}]}')).toBe(false);
    expect(hasTextContent("")).toBe(false);
  });
});

describe("findOrphanImages", () => {
  const used = "11111111-1111-1111-1111-111111111111.png";
  const usedSvg = "22222222-2222-2222-2222-222222222222.svg";
  const orphan = "33333333-3333-3333-3333-333333333333.webp";
  const contents = [
    JSON.stringify({ src: `local-image:images/${used}` }),
    JSON.stringify({ src: `local-image:images/${usedSvg}` }),
  ];

  it("returns only unreferenced files", () => {
    expect(findOrphanImages([used, usedSvg, orphan], contents)).toEqual([orphan]);
  });
  it("never flags files with unusual extensions that are referenced", () => {
    expect(findOrphanImages([usedSvg], contents)).toEqual([]);
  });
  it("keeps an image whose note reference uses a different extension", () => {
    expect(findOrphanImages(["11111111-1111-1111-1111-111111111111.svg+xml"], contents)).toEqual([]);
  });
  it("is case-insensitive for uuids", () => {
    expect(findOrphanImages([used.toUpperCase()], contents)).toEqual([]);
  });
  it("uses a substring check for files without a uuid name", () => {
    const c = [JSON.stringify({ src: "local-image:images/photo.png" })];
    expect(findOrphanImages(["photo.png", "other.png"], c)).toEqual(["other.png"]);
  });
  it("flags everything when there are no notes", () => {
    expect(findOrphanImages([used], [])).toEqual([used]);
  });
});
