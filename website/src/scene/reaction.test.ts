import { describe, expect, it } from "vitest";
import { createReaction } from "./reaction";

describe("local reaction motion", () => {
  it("adds another impulse without resetting the current pose", () => {
    const reaction = createReaction(24, 1.7);
    expect(reaction.step(1)).toBe(0);
    reaction.kick();
    const pose = reaction.step(0.05);
    expect(pose).toBeGreaterThan(0.5);
    reaction.kick();
    expect(reaction.step(0)).toBe(pose);
    expect(Math.abs(reaction.step(0.001) - pose)).toBeLessThan(0.04);
  });

  it("stays bounded under repeated clicks and settles afterwards", () => {
    const reaction = createReaction(13, 1.6);
    for (let i = 0; i < 600; i++) {
      reaction.kick();
      expect(Math.abs(reaction.step(1 / 60))).toBeLessThan(2);
    }
    expect(Math.abs(reaction.step(8))).toBeLessThan(0.0001);
  });

  it("has the same motion at different frame rates", () => {
    const a = createReaction(10, 1.7), b = createReaction(10, 1.7);
    a.kick(); b.kick();
    for (let i = 0; i < 60; i++) a.step(1 / 60);
    for (let i = 0; i < 120; i++) b.step(1 / 120);
    expect(a.step(0)).toBeCloseTo(b.step(0), 10);
  });
});
