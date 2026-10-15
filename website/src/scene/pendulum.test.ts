import { describe, expect, it } from "vitest";
import { createPendulum } from "./pendulum";

describe("lantern inertia", () => {
  it("falls behind an accelerating branch, then keeps swinging after it stops", () => {
    const pendulum = createPendulum(1);
    pendulum.step(0, 0, 0);
    expect(pendulum.step(1 / 60, 0.02, 0)).toBeLessThan(0);
    const poses: number[] = [];
    for (let i = 0; i < 240; i++) poses.push(pendulum.step(1 / 60, 0.02, 0));
    expect(Math.max(...poses)).toBeGreaterThan(0.005);
    expect(Math.min(...poses)).toBeLessThan(-0.005);
    for (let i = 0; i < 1200; i++) pendulum.step(1 / 60, 0.02, 0);
    expect(Math.abs(pendulum.step(0, 0.02, 0))).toBeLessThan(0.0001);
    expect(Math.abs(pendulum.velocity)).toBeLessThan(0.0001);
  });

  it("adds or removes momentum according to the branch's acceleration, without restarting its angle", () => {
    const a = createPendulum(1), b = createPendulum(1);
    a.step(0, 0, 0); b.step(0, 0, 0);
    for (let i = 1; i <= 8; i++) {
      a.step(1 / 120, i * 0.25 / 120, 0);
      b.step(1 / 120, i * 0.25 / 120, 0);
    }
    const pose = a.step(0, 0, 0), speed = a.velocity;
    expect(speed).toBeLessThan(0);
    const x = 8 * 0.25 / 120;
    const strengthened = a.step(1 / 120, x + 0.5 / 120, 0);
    const slowed = b.step(1 / 120, x, 0);
    expect(a.velocity).toBeLessThan(speed);
    expect(b.velocity).toBeGreaterThan(speed);
    expect(Math.abs(strengthened - pose)).toBeLessThan(0.01);
    expect(Math.abs(slowed - pose)).toBeLessThan(0.01);
  });

  it("is stable under sustained shaking and has similar motion at 30, 60 and 120 fps", () => {
    const run = (fps: number) => {
      const pendulum = createPendulum(1.4);
      pendulum.step(0, 0, 0);
      let pose = 0;
      for (let i = 1; i <= fps * 12; i++) {
        pose = pendulum.step(1 / fps, Math.sin(i / fps * 13) * 0.16, 0);
        expect(Number.isFinite(pose + pendulum.velocity)).toBe(true);
        expect(Math.abs(pose)).toBeLessThanOrEqual(0.6);
      }
      return pose;
    };
    expect(run(30)).toBeCloseTo(run(120), 1);
    expect(run(60)).toBeCloseTo(run(120), 1);
  });

  it("gives long cords a slower swing than short cords", () => {
    const crossing = (length: number) => {
      const pendulum = createPendulum(length);
      pendulum.step(0, 0, 0);
      pendulum.step(1 / 120, 0.02, 0);
      let crossed = false;
      for (let i = 1; i < 1000; i++) {
        const angle = pendulum.step(1 / 120, 0.02, 0);
        if (angle > 0) crossed = true;
        if (crossed && angle < 0) return i / 120;
      }
      throw new Error("No complete swing");
    };
    expect(crossing(2.5)).toBeGreaterThan(crossing(0.8) * 1.4);
  });
});
