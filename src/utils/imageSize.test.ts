import { describe, it, expect } from "vitest";
import { resizedWidth } from "./imageSize";

describe("resizedWidth", () => {
  it("adds the drag distance to the start width", () => {
    expect(resizedWidth(300, 50, 800)).toBe(350);
    expect(resizedWidth(300, -50, 800)).toBe(250);
  });

  it("never goes below 100px", () => {
    expect(resizedWidth(300, -500, 800)).toBe(100);
  });

  it("never goes wider than the text column", () => {
    expect(resizedWidth(700, 400, 800)).toBe(800);
  });

  it("keeps 100px even when the column is narrower than that", () => {
    expect(resizedWidth(300, 10, 60)).toBe(100);
  });

  it("does not limit the width when the column is unknown", () => {
    expect(resizedWidth(300, 1000, 0)).toBe(1300);
  });
});
