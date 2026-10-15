import { describe, expect, it } from "vitest";
import { PETAL_BOUNDS, burstPetals, createPetals, stepPetals } from "./petals";

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

describe("petal bursts (a shaken tree)", () => {
  const spares = (s: ReturnType<typeof createPetals>) => Array.from({ length: s.count - s.regular }, (_, k) => s.regular + k);
  const origin: [number, number, number] = [8, 8, -19.5];

  it("keeps spare petals at rest until a burst wakes them", () => {
    const s = createPetals(20, 3, 30);
    expect(s.count).toBe(50);
    expect(spares(s).every((i) => s.active[i] === 0)).toBe(true);
    const before = Array.from(s.pos);
    for (let i = 0; i < 60; i++) stepPetals(s, 1 / 60);
    expect(spares(s).every((i) => s.pos[i * 3] === before[i * 3])).toBe(true); // resting spares do not move
    burstPetals(s, origin, 25);
    expect(spares(s).filter((i) => s.active[i] === 1)).toHaveLength(25);
  });

  it("throws them out from the blossom, up and away, and they then drift and fall", () => {
    const s = createPetals(10, 3, 40);
    burstPetals(s, origin, 40, 2);
    const woken = spares(s);
    expect(woken.every((i) => Math.hypot(s.pos[i * 3] - origin[0], s.pos[i * 3 + 1] - origin[1], s.pos[i * 3 + 2] - origin[2]) <= 2.0001)).toBe(true);
    const r0 = woken.map((i) => Math.hypot(s.pos[i * 3] - origin[0], s.pos[i * 3 + 2] - origin[2]));
    for (let i = 0; i < 20; i++) stepPetals(s, 1 / 60);
    const r1 = woken.map((i) => Math.hypot(s.pos[i * 3] - origin[0], s.pos[i * 3 + 2] - origin[2]));
    expect(r1.filter((r, k) => r > r0[k]).length / woken.length).toBeGreaterThan(0.7); // mostly moving outward
    const kickBefore = Math.abs(s.kick[woken[0] * 3]) + Math.abs(s.kick[woken[0] * 3 + 1]);
    for (let i = 0; i < 300; i++) stepPetals(s, 1 / 60);
    expect(Math.abs(s.kick[woken[0] * 3]) + Math.abs(s.kick[woken[0] * 3 + 1])).toBeLessThan(kickBefore * 0.05); // the push fades
  });

  it("rests again after falling or blowing away, and stays finite", () => {
    const s = createPetals(10, 3, 40);
    burstPetals(s, origin, 40);
    for (let i = 0; i < 60 * 40; i++) stepPetals(s, 1 / 60);
    expect(spares(s).every((i) => s.active[i] === 0)).toBe(true);
    for (const i of spares(s)) expect(Number.isFinite(s.pos[i * 3] + s.pos[i * 3 + 1] + s.pos[i * 3 + 2])).toBe(true);
  });

  it("keeps airborne petals in place when another burst fills the pool", () => {
    const s = createPetals(10, 3, 12);
    burstPetals(s, origin, 8);
    stepPetals(s, 0.1);
    const regularBefore = s.pos.slice(0, 30);
    const before = s.pos.slice(30, 54), kick = s.kick.slice(30, 54), phase = s.phase.slice(10, 18);
    burstPetals(s, [0, 10, -15], 12);
    expect(spares(s).every((i) => s.active[i] === 1)).toBe(true);
    expect(s.pos.slice(30, 54)).toEqual(before);
    expect(s.kick.slice(30, 54)).toEqual(kick);
    expect(s.phase.slice(10, 18)).toEqual(phase);
    const full = s.pos.slice();
    burstPetals(s, origin, 12);
    expect(s.pos).toEqual(full);
    expect(s.pos.slice(0, 30)).toEqual(regularBefore);
    expect(s.next).toBeGreaterThanOrEqual(s.regular);
    expect(s.next).toBeLessThan(s.count);
    s.active[13] = 0;
    burstPetals(s, origin, 1, 0);
    expect(s.active[13]).toBe(1);
    expect(Array.from(s.pos.slice(39, 42))).toEqual(origin);
  });

  it("does nothing when there are no spares", () => {
    const s = createPetals(10, 3);
    const before = Array.from(s.pos);
    burstPetals(s, origin, 20);
    expect(Array.from(s.pos)).toEqual(before);
  });
});
