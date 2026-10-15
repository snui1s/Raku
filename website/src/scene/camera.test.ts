import { describe, expect, it } from "vitest";
import { journeyParallax, parallaxOffset } from "./camera";

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

describe("journeyParallax", () => {
  it("is the same as the hero's parallax until the close-up", () => {
    expect(journeyParallax({ x: 0.5, y: -0.5 }, 0)).toEqual(parallaxOffset({ x: 0.5, y: -0.5 }));
  });

  it("is smaller, but not gone, at the fox close-up, and never grows", () => {
    const full = parallaxOffset({ x: 1, y: 1 }).x, near = journeyParallax({ x: 1, y: 1 }, 1).x;
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(full * 0.5);
    let prev = full;
    for (let c = 0; c <= 1; c += 0.1) { const v = journeyParallax({ x: 1, y: 1 }, c).x; expect(v).toBeLessThanOrEqual(prev + 1e-12); prev = v; }
  });

  it("keeps the sign and treats out-of-range closeness as the nearest end", () => {
    expect(journeyParallax({ x: -1, y: 1 }, 0.3).x).toBeLessThan(0);
    expect(journeyParallax({ x: 1, y: 1 }, 5)).toEqual(journeyParallax({ x: 1, y: 1 }, 1));
    expect(journeyParallax({ x: 1, y: 1 }, -2)).toEqual(journeyParallax({ x: 1, y: 1 }, 0));
  });
});
