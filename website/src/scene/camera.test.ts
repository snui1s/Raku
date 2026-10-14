import { describe, expect, it } from "vitest";
import { parallaxOffset } from "./camera";

describe("parallaxOffset", () => {
  it("is zero at the center", () => {
    expect(parallaxOffset({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("clamps far-out pointers to 0.35 world units", () => {
    expect(parallaxOffset({ x: 5, y: -5 })).toEqual({ x: 0.35, y: -0.35 });
    expect(parallaxOffset({ x: -9, y: 9 })).toEqual({ x: -0.35, y: 0.35 });
  });

  it("scales linearly inside the range", () => {
    const o = parallaxOffset({ x: 0.5, y: -0.5 });
    expect(o.x).toBeCloseTo(0.175);
    expect(o.y).toBeCloseTo(-0.175);
  });
});
