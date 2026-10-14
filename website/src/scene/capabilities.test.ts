import { describe, expect, it } from "vitest";
import { adaptPixelRatioScale, cappedPixelRatio, shouldRunScene, type Env } from "./capabilities";

const ok: Env = { webgl: true, reducedMotion: false, width: 1280, coarsePointer: false };

describe("shouldRunScene", () => {
  it("runs on a capable desktop browser", () => {
    expect(shouldRunScene(ok)).toBe(true);
  });

  it("does not run when any single condition fails", () => {
    expect(shouldRunScene({ ...ok, webgl: false })).toBe(false);
    expect(shouldRunScene({ ...ok, reducedMotion: true })).toBe(false);
    expect(shouldRunScene({ ...ok, coarsePointer: true })).toBe(false);
    expect(shouldRunScene({ ...ok, width: 767 })).toBe(false);
  });

  it("treats 768 px as the first width that runs", () => {
    expect(shouldRunScene({ ...ok, width: 768 })).toBe(true);
  });
});

describe("cappedPixelRatio", () => {
  it("caps at 2 and falls back to 1 for missing or invalid values", () => {
    expect(cappedPixelRatio(1)).toBe(1);
    expect(cappedPixelRatio(1.5)).toBe(1.5);
    expect(cappedPixelRatio(3)).toBe(2);
    expect(cappedPixelRatio(0)).toBe(1);
    expect(cappedPixelRatio(Number.NaN)).toBe(1);
    expect(cappedPixelRatio(undefined)).toBe(1);
  });
});

describe("adaptPixelRatioScale", () => {
  it("lowers the render scale when frames are slow, never below the floor", () => {
    expect(adaptPixelRatioScale(1, 40)).toBe(0.75);
    expect(adaptPixelRatioScale(0.75, 40)).toBe(0.6);
    expect(adaptPixelRatioScale(0.6, 80)).toBe(0.6);
  });

  it("keeps the scale when the frame rate is fine", () => {
    expect(adaptPixelRatioScale(1, 16.7)).toBe(1);
    expect(adaptPixelRatioScale(0.75, 20)).toBe(0.75);
  });

  it("ignores nonsense frame times", () => {
    expect(adaptPixelRatioScale(1, Number.NaN)).toBe(1);
    expect(adaptPixelRatioScale(1, 0)).toBe(1);
  });
});
