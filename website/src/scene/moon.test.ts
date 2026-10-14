import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";
import { MOON, buildMoon } from "./moon";

describe("buildMoon", () => {
  it("has a disc and a glow, in both themes", () => {
    for (const p of [PALETTE.light, PALETTE.dark]) {
      const g = buildMoon(p).object;
      expect(g.getObjectByName("moon-disc")).toBeTruthy();
      expect(g.getObjectByName("moon-glow")).toBeTruthy();
    }
  });

  it("sits in the upper left of a 16:10 view, clear of the headline", () => {
    const cam = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    cam.position.set(...CAMERA.position);
    cam.lookAt(new Vector3(...CAMERA.target));
    cam.updateMatrixWorld(true);
    const g = buildMoon(PALETTE.dark).object;
    g.updateMatrixWorld(true);
    const ndc = g.getObjectByName("moon-disc")!.getWorldPosition(new Vector3()).project(cam);
    expect(ndc.x).toBeGreaterThan(-0.75);
    expect(ndc.x).toBeLessThan(-0.25);
    expect(ndc.y).toBeGreaterThan(0.45);
    expect(ndc.y).toBeLessThan(0.85);
  });

  it("is a few degrees wide", () => {
    const g = buildMoon(PALETTE.dark).object;
    const r = (g.getObjectByName("moon-disc") as unknown as { geometry: { parameters: { radius: number } } }).geometry.parameters.radius;
    const deg = (Math.atan(r / MOON.distance) * 180) / Math.PI;
    expect(deg).toBeGreaterThan(2);
    expect(deg).toBeLessThan(5);
  });
});
