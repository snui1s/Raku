import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";
import { MOON, MOON_RADIUS, buildMoon } from "./moon";

describe("buildMoon", () => {
  it("is a single mesh (no stacked coplanar layers to fight over depth)", () => {
    const g = buildMoon(PALETTE).object;
    expect(g.children).toHaveLength(1);
    expect(g.getObjectByName("moon-disc")).toBeTruthy();
  });

  it("sits in the upper left of a 16:10 view, clear of the headline", () => {
    const cam = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    cam.position.set(...CAMERA.position);
    cam.lookAt(new Vector3(...CAMERA.target));
    cam.updateMatrixWorld(true);
    const g = buildMoon(PALETTE).object;
    g.updateMatrixWorld(true);
    const ndc = g.getObjectByName("moon-disc")!.getWorldPosition(new Vector3()).project(cam);
    expect(ndc.x).toBeGreaterThan(-0.75);
    expect(ndc.x).toBeLessThan(-0.25);
    expect(ndc.y).toBeGreaterThan(0.45);
    expect(ndc.y).toBeLessThan(0.85);
  });

  it("is a few degrees wide", () => {
    const deg = (Math.atan(MOON_RADIUS / MOON.distance) * 180) / Math.PI;
    expect(deg).toBeGreaterThan(2);
    expect(deg).toBeLessThan(5);
  });
});
