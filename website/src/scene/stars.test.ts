import { describe, expect, it } from "vitest";
import { Points } from "three";
import { PALETTE } from "./palette";
import { STARS, buildStars, generateStars } from "./stars";

describe("generateStars", () => {
  const s = generateStars(STARS.count, 5);

  it("places every star on the sky dome inside the visible window", () => {
    expect(s.positions.length).toBe(STARS.count * 3);
    for (let i = 0; i < STARS.count; i++) {
      const x = s.positions[i * 3], y = s.positions[i * 3 + 1], z = s.positions[i * 3 + 2];
      expect(Math.hypot(x, y, z)).toBeCloseTo(STARS.radius, 3);
      expect(z).toBeLessThan(0); // in front of the camera
      const elevation = (Math.asin(y / STARS.radius) * 180) / Math.PI;
      expect(elevation).toBeGreaterThanOrEqual(STARS.elevationDeg[0] - 0.01);
      expect(elevation).toBeLessThanOrEqual(STARS.elevationDeg[1] + 0.01);
    }
  });

  it("mixes white and yellow stars", () => {
    let yellow = 0;
    for (let i = 0; i < STARS.count; i++) {
      const [r, g, b] = [s.colors[i * 3], s.colors[i * 3 + 1], s.colors[i * 3 + 2]];
      if (b < g - 0.05 && r > 0.9) yellow++; // yellow has less blue than green
    }
    expect(yellow / STARS.count).toBeGreaterThan(0.25);
    expect(yellow / STARS.count).toBeLessThan(0.6);
  });

  it("has sizes in range and is deterministic", () => {
    for (const z of s.sizes) {
      expect(z).toBeGreaterThanOrEqual(STARS.size[0]);
      expect(z).toBeLessThanOrEqual(STARS.size[1]);
    }
    expect(Array.from(generateStars(STARS.count, 5).positions.slice(0, 30))).toEqual(Array.from(s.positions.slice(0, 30)));
  });
});

describe("buildStars", () => {
  it("is empty in the light theme (daytime) and has points at night", () => {
    expect(buildStars(PALETTE.light).object.children).toHaveLength(0);
    const night = buildStars(PALETTE.dark).object;
    expect(night.children.some((c) => (c as Points).isPoints)).toBe(true);
  });
});
