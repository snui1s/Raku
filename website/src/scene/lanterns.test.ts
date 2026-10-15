import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { PALETTE } from "./palette";
import { GATE } from "./journey";
import { LANTERNS, buildLanterns } from "./lanterns";

describe("buildLanterns", () => {
  it("has four lanterns, one for each number", () => {
    const { object } = buildLanterns(() => 1);
    for (let i = 0; i < 4; i++) expect(object.getObjectByName(`lantern-${i}`), `lantern ${i}`).toBeTruthy();
    expect(LANTERNS).toHaveLength(4);
  });

  it("keeps them out of sight until the numbers chapter, so the hero and the stills do not show them", () => {
    let show = 0;
    const { object, update } = buildLanterns(() => show);
    update!(0, 1 / 60);
    for (let i = 0; i < 4; i++) expect(object.getObjectByName(`lantern-${i}`)!.visible).toBe(false);
    show = 1;
    update!(0, 1 / 60);
    for (let i = 0; i < 4; i++) {
      const l = object.getObjectByName(`lantern-${i}`)!;
      expect(l.visible).toBe(true);
      expect(l.scale.x).toBeCloseTo(1, 9);
    }
  });

  it("hangs in the places LANTERNS says, and sways only a little", () => {
    const { object, update } = buildLanterns(() => 1);
    for (let t = 0; t < 60; t += 0.7) {
      update!(t, 1 / 60);
      object.updateMatrixWorld(true);
      LANTERNS.forEach((p, i) => {
        const l = object.getObjectByName(`lantern-${i}`)!;
        expect(l.position.distanceTo(new Vector3(...p))).toBeLessThan(1e-9);
        expect(Math.abs(l.rotation.z)).toBeLessThan(0.25);
      });
    }
  });

  it("all four are in view, spread across the screen, from the gate camera", () => {
    const cam = new PerspectiveCamera(GATE.fov, 1.6, 0.1, 500);
    cam.position.copy(GATE.position);
    cam.lookAt(GATE.position.clone().add(GATE.direction));
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    const ndc = LANTERNS.map((p) => new Vector3(...p).project(cam));
    ndc.forEach((v, i) => {
      expect(Math.abs(v.x), `lantern ${i} x`).toBeLessThan(0.85);
      expect(v.y, `lantern ${i} y`).toBeLessThan(0.7);
      expect(v.y, `lantern ${i} y`).toBeGreaterThan(-0.2); // the number goes under it, so leave room below
    });
    const xs = ndc.map((v) => v.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1], "spacing").toBeGreaterThan(0.25); // room for a number each
  });

  it("uses a warm light colour from the palette family, not the accent red", () => {
    const { object } = buildLanterns(() => 1);
    const body = object.getObjectByName("lantern-0-body") as unknown as { material: { color: { r: number; g: number; b: number } } };
    expect(body.material.color.r).toBeGreaterThan(body.material.color.b);
    expect(PALETTE.accent).toBeGreaterThan(0);
  });
});
