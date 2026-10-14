import { describe, expect, it } from "vitest";
import { PETAL_BOUNDS, createPetals, stepPetals } from "./petals";

describe("petals", () => {
  it("stay finite and inside the bounds over a long run", () => {
    const s = createPetals(38, 3);
    for (let i = 0; i < 5000; i++) stepPetals(s, 1 / 60);
    for (let i = 0; i < s.count; i++) {
      const [x, y, z] = [s.pos[i * 3], s.pos[i * 3 + 1], s.pos[i * 3 + 2]];
      expect(Number.isFinite(x + y + z)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(PETAL_BOUNDS.xMin - 1);
      expect(x).toBeLessThanOrEqual(PETAL_BOUNDS.xMax + 4);
      expect(y).toBeGreaterThanOrEqual(PETAL_BOUNDS.yMin - 1);
      expect(y).toBeLessThanOrEqual(PETAL_BOUNDS.yMax + 4);
    }
  });

  it("drift from right to left (only a respawn at the right edge may move a petal right)", () => {
    const s = createPetals(38, 3);
    const before = Array.from({ length: s.count }, (_, i) => s.pos[i * 3]);
    for (let i = 0; i < 30; i++) stepPetals(s, 1 / 60);
    const movedLeft = before.filter((x, i) => s.pos[i * 3] < x).length;
    expect(movedLeft / s.count).toBeGreaterThanOrEqual(0.9);
  });

  it("clamps a huge time step (tab restored after a long pause) so nothing jumps", () => {
    const a = createPetals(38, 3), b = createPetals(38, 3);
    stepPetals(a, 5);
    stepPetals(b, 0.1);
    expect(Array.from(a.pos)).toEqual(Array.from(b.pos));
  });

  it("is deterministic for a seed", () => {
    const a = createPetals(10, 9), b = createPetals(10, 9);
    expect(Array.from(a.pos)).toEqual(Array.from(b.pos));
  });
});
