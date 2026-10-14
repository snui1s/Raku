import { describe, it, expect } from "vitest";
import { makeNotes } from "../../bench/data";
import { extractTitle, hasTextContent, findOrphanImages } from "./noteUtils";

// Regression guards, not precise benchmarks (see `bun run bench`). Budgets are deliberately generous
// so slow CI machines pass, but an accidentally quadratic change will still fail.
const time = (fn: () => void) => {
  const t0 = performance.now();
  fn();
  return performance.now() - t0;
};

describe("scales to a large library (5,000 notes)", () => {
  const notes = makeNotes(5000);
  const contents = notes.map((n) => n.content);
  const images = contents
    .map((c) => c.match(/[0-9a-f-]{36}\.png/)?.[0])
    .filter((x): x is string => !!x);

  it("extracts every title quickly", () => {
    expect(time(() => contents.forEach((c) => extractTitle(c)))).toBeLessThan(2000);
  });

  it("checks every note for text quickly", () => {
    expect(time(() => contents.forEach((c) => hasTextContent(c)))).toBeLessThan(2000);
  });

  it("finds unused images in linear time", () => {
    let orphans: string[] = [];
    const ms = time(() => {
      orphans = findOrphanImages([...images, "orphan.png"], contents);
    });
    expect(orphans).toEqual(["orphan.png"]);
    expect(ms).toBeLessThan(1500);
  });
});
