import { describe, expect, it } from "vitest";
import { Mesh, ShaderMaterial, Vector3 } from "three";
import { SHOOTING, buildShootingStars } from "./shootingstar";
import { mulberry32 } from "./rng";

const slot = (part: ReturnType<typeof buildShootingStars>, i: number) => part.object.getObjectByName(`shooting-star-${i}`)!;
const uP = (part: ReturnType<typeof buildShootingStars>, i: number) => ((slot(part, i).children[0] as Mesh).material as ShaderMaterial).uniforms.uP.value as number;
const head = (part: ReturnType<typeof buildShootingStars>, i: number) => {
  part.object.updateMatrixWorld(true);
  return (slot(part, i).children[0] as Mesh).getWorldPosition(new Vector3());
};
const STAR = new Vector3(-60, 120, -170);

describe("buildShootingStars", () => {
  it("shows nothing until a star is clicked", () => {
    const part = buildShootingStars();
    for (let i = 0; i < SHOOTING.pool; i++) expect(slot(part, i).visible).toBe(false);
    expect(part.active()).toBe(0);
  });

  it("starts at the star that was clicked, on the dome, and shows", () => {
    const part = buildShootingStars(mulberry32(1));
    part.shoot(STAR);
    expect(part.active()).toBe(1);
    const h = slot(part, 0);
    expect(h.visible).toBe(true);
    expect(h.position.length()).toBeCloseTo(SHOOTING.radius, 6);
    expect(h.position.clone().normalize().distanceTo(STAR.clone().normalize())).toBeLessThan(1e-6); // in the same direction
  });

  it("flies down the sky and fades in and out, then is gone", () => {
    const part = buildShootingStars(mulberry32(2));
    part.shoot(STAR);
    const y0 = head(part, 0).y, peak: number[] = [];
    for (let i = 0; i < SHOOTING.seconds * 60 * 0.5; i++) { part.update!(0, 1 / 60); peak.push(uP(part, 0)); }
    expect(head(part, 0).y).toBeLessThan(y0 - 5); // it has fallen
    for (let i = 0; i < SHOOTING.seconds * 60 + 5; i++) part.update!(0, 1 / 60);
    expect(part.active()).toBe(0);
    expect(slot(part, 0).visible).toBe(false);
    expect(uP(part, 0)).toBe(0);
  });

  it("always falls rather than rises, wherever on the dome it starts", () => {
    const rand = mulberry32(3);
    for (let k = 0; k < 60; k++) {
      const part = buildShootingStars(rand);
      const from = new Vector3((rand() - 0.5) * 300, 40 + rand() * 160, -(60 + rand() * 160));
      part.shoot(from);
      const y0 = head(part, 0).y;
      for (let i = 0; i < 30; i++) part.update!(0, 1 / 60);
      expect(head(part, 0).y, `start ${from.toArray().map((n) => n.toFixed(0))}`).toBeLessThan(y0);
    }
  });

  it("stays on the dome while it flies (it does not come closer, and goes only a little behind)", () => {
    const part = buildShootingStars(mulberry32(4));
    part.shoot(STAR);
    for (let i = 0; i < 40; i++) {
      part.update!(0, 1 / 60);
      const d = head(part, 0).length();
      expect(d).toBeGreaterThan(SHOOTING.radius - 6);
      expect(d).toBeLessThan(SHOOTING.radius + 14); // a straight path drifts a little outward from the sphere
    }
  });

  it("lets every active flight finish when the pool is full, then reuses a finished slot", () => {
    const part = buildShootingStars(mulberry32(5));
    for (let i = 0; i < SHOOTING.pool; i++) { part.shoot(STAR); part.update!(0, 0.1); }
    expect(part.active()).toBe(SHOOTING.pool);
    const before = Array.from({ length: SHOOTING.pool }, (_, i) => ({ head: head(part, i), progress: uP(part, i) }));
    part.shoot(new Vector3(100, 100, -150));
    expect(part.active()).toBe(SHOOTING.pool);
    before.forEach((value, i) => {
      expect(head(part, i)).toEqual(value.head);
      expect(uP(part, i)).toBe(value.progress);
    });
    part.update!(0, SHOOTING.seconds);
    part.shoot(STAR);
    expect(part.active()).toBe(1);
    expect(uP(part, 0)).toBe(0);
  });

  it("is brightest in the middle of its flight and dark at both ends", () => {
    const part = buildShootingStars(mulberry32(6));
    part.shoot(STAR);
    expect(uP(part, 0)).toBe(0); // the shader gives sin(pi * 0) = 0 at the start
    part.update!(0, SHOOTING.seconds / 2);
    expect(uP(part, 0)).toBeCloseTo(0.5, 6); // and 1 at the middle
  });
});
