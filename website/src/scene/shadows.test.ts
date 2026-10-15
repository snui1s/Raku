import { describe, expect, it } from "vitest";
import { DirectionalLight, OrthographicCamera, Vector3 } from "three";
import { buildHill } from "./hill";
import { Mesh } from "three";
import { PALETTE } from "./palette";
import { buildMoon } from "./moon";
import { LIGHTING, SHADOW_TARGET, configureMoonLight, fitShadowBounds, moonDirection, shadowFitPoints } from "./shadows";

describe("moonDirection", () => {
  it("is a unit vector pointing at the moon disc", () => {
    const d = moonDirection();
    expect(d.length()).toBeCloseTo(1);
    const moon = buildMoon(PALETTE).object;
    moon.updateMatrixWorld(true);
    const toDisc = new Vector3().setFromMatrixPosition(moon.matrixWorld).normalize();
    expect(d.distanceTo(toDisc)).toBeLessThan(1e-6);
  });

  it("is up, to the left and behind the scene, so shadows fall toward the camera", () => {
    const d = moonDirection();
    expect(d.y).toBeGreaterThan(0);
    expect(d.x).toBeLessThan(0);
    expect(d.z).toBeLessThan(0); // the camera looks down -z, so the moon is beyond the scene
  });
});

describe("configureMoonLight", () => {
  const make = () => {
    const light = new DirectionalLight(0xffffff, LIGHTING.moon);
    configureMoonLight(light);
    return light;
  };

  it("sits along the moon's direction from the shadow target and casts shadows", () => {
    const light = make();
    expect(light.castShadow).toBe(true);
    const dir = light.position.clone().sub(light.target.position).normalize();
    expect(dir.distanceTo(moonDirection())).toBeLessThan(1e-6);
    expect(light.target.position.equals(SHADOW_TARGET)).toBe(true);
  });

  it("has a shadow box that contains everything that casts or receives a shadow", () => {
    const light = make();
    const cam = light.shadow.camera as OrthographicCamera;
    cam.position.copy(light.position);
    cam.lookAt(light.target.position);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    for (const p of shadowFitPoints()) {
      const ndc = p.clone().project(cam);
      expect(Math.abs(ndc.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(ndc.y)).toBeLessThanOrEqual(1);
      expect(ndc.z).toBeGreaterThanOrEqual(-1);
      expect(ndc.z).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the shadow map sharp enough for leaves, and the box no bigger than it needs to be", () => {
    const light = make();
    const cam = light.shadow.camera as OrthographicCamera;
    const texel = Math.max(cam.right - cam.left, cam.top - cam.bottom) / light.shadow.mapSize.x;
    expect(texel).toBeLessThan(0.03); // a blossom is about half a unit across
    expect(cam.far).toBeGreaterThan(cam.near);
    expect(cam.near).toBeGreaterThan(0);
  });

  it("softens the edge and guards against shadow acne", () => {
    const s = make().shadow;
    expect(s.radius).toBeGreaterThan(1);
    expect(s.normalBias).toBeGreaterThan(0);
    expect(s.bias).toBeLessThan(0);
  });
});

describe("fitShadowBounds", () => {
  it("is a symmetric box around a single point on the aim, plus the margin", () => {
    const target = new Vector3(0, 0, 0);
    const b = fitShadowBounds(new Vector3(0, 1, 0), target, 50, [target.clone()], 2);
    expect(b.left).toBeCloseTo(-2);
    expect(b.right).toBeCloseTo(2);
    expect(b.top).toBeCloseTo(2);
    expect(b.bottom).toBeCloseTo(-2);
    expect(b.near).toBeCloseTo(48);
    expect(b.far).toBeCloseTo(52);
  });
});

describe("LIGHTING", () => {
  // The toon ramp gives a surface facing a light the full band (1.0) and one facing away the lowest (0.35).
  const OLD_TOTAL = 1.1 + 2.2; // ambient + sun before the moon light existed
  it("keeps ground facing up close to its old brightness", () => {
    const ground = LIGHTING.ambient + LIGHTING.sun + LIGHTING.moon;
    expect(Math.abs(ground / OLD_TOTAL - 1)).toBeLessThan(0.12);
  });

  it("keeps surfaces facing the camera (away from the moon) close to their old brightness", () => {
    const front = LIGHTING.ambient + LIGHTING.sun + 0.35 * LIGHTING.moon;
    expect(Math.abs(front / OLD_TOTAL - 1)).toBeLessThan(0.2);
  });

  it("leaves the moon light strong enough that shadowed ground is visibly darker", () => {
    expect(LIGHTING.moon / (LIGHTING.ambient + LIGHTING.sun + LIGHTING.moon)).toBeGreaterThan(0.25);
  });
});

describe("buildHill", () => {
  it("marks the main hill, and not the far one, as a shadow receiver", () => {
    const hill = buildHill(PALETTE, null as never);
    const meshes = hill.children as Mesh[];
    expect(meshes.filter((m) => m.receiveShadow)).toHaveLength(1);
  });
});
