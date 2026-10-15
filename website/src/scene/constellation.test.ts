import { describe, expect, it } from "vitest";
import { PerspectiveCamera, ShaderMaterial, Mesh, Vector3 } from "three";
import { CAMERA } from "./camera";
import {
  CONSTELLATION, applyConstellationCamera, buildConstellation, constellationHeightVh, constellationTimeline, projectStars,
  starDirection,
} from "./constellation";

const cam = (aspect = 1.6) => {
  const c = new PerspectiveCamera(CAMERA.fov, aspect, 0.1, 500);
  return c;
};
const forward = (c: PerspectiveCamera) => c.getWorldDirection(new Vector3());

describe("constellationTimeline", () => {
  it("holds the hero, then tilts, then walks through the features", () => {
    expect(constellationTimeline(0)).toEqual({ tilt: 0, feature: 0 });
    expect(constellationTimeline(CONSTELLATION.holdVh / 2).tilt).toBe(0);
    const tiltDone = CONSTELLATION.holdVh + CONSTELLATION.tiltVh;
    expect(constellationTimeline(tiltDone).tilt).toBe(1);
    expect(constellationTimeline(tiltDone).feature).toBeCloseTo(0, 9); // floating point: 1.1 - 0.2 - 0.9 is not exactly 0
    expect(constellationTimeline(tiltDone + CONSTELLATION.itemVh * 2.5).feature).toBeCloseTo(2.5, 5);
    expect(constellationTimeline(999)).toEqual({ tilt: 1, feature: CONSTELLATION.stars.length });
  });

  it("never goes backwards and ignores negative scroll", () => {
    let prev = constellationTimeline(-1);
    expect(prev).toEqual({ tilt: 0, feature: 0 });
    for (let s = 0; s < 8; s += 0.05) {
      const t = constellationTimeline(s);
      expect(t.tilt).toBeGreaterThanOrEqual(prev.tilt);
      expect(t.feature).toBeGreaterThanOrEqual(prev.feature);
      prev = t;
    }
  });

  it("is a reasonable scroll length (no longer than about five screens)", () => {
    expect(constellationHeightVh()).toBeLessThanOrEqual(5.5);
    expect(constellationHeightVh()).toBeGreaterThan(CONSTELLATION.holdVh + CONSTELLATION.tiltVh);
  });
});

describe("applyConstellationCamera", () => {
  it("is exactly the hero camera at tilt 0", () => {
    const c = cam();
    applyConstellationCamera(c, 0, 0);
    c.updateMatrixWorld(true);
    const want = new Vector3(...CAMERA.target).sub(new Vector3(...CAMERA.position)).normalize();
    expect(forward(c).distanceTo(want)).toBeLessThan(1e-6);
    expect(c.up.y).toBe(1); // never rolled
  });

  it("looks well up into the sky at tilt 1", () => {
    const c = cam();
    applyConstellationCamera(c, 1, 0);
    c.updateMatrixWorld(true);
    expect(Math.asin(forward(c).y) * (180 / Math.PI)).toBeGreaterThan(28);
  });

  it("brings each feature star into view, left of centre so its label has room on the right", () => {
    const c = cam();
    CONSTELLATION.stars.forEach((_, i) => {
      applyConstellationCamera(c, 1, i + 0.5);
      c.updateMatrixWorld(true);
      c.updateProjectionMatrix();
      const ndc = starDirection(i).clone().project(c);
      expect(ndc.x, `star ${i} x`).toBeGreaterThan(-0.85);
      expect(ndc.x, `star ${i} x`).toBeLessThan(0.3);
      expect(Math.abs(ndc.y), `star ${i} y`).toBeLessThan(0.75);
    });
  });

  it("moves smoothly while scrolling (no jumps between close scroll positions)", () => {
    const c = cam();
    let prev: Vector3 | null = null;
    for (let f = 0; f <= CONSTELLATION.stars.length; f += 0.02) {
      applyConstellationCamera(c, 1, f);
      c.updateMatrixWorld(true);
      const d = forward(c).clone();
      if (prev) expect(d.distanceTo(prev)).toBeLessThan(0.02);
      prev = d;
    }
  });
});

describe("projectStars", () => {
  it("returns CSS pixel positions and marks stars behind the camera as hidden", () => {
    const c = cam(1.6);
    applyConstellationCamera(c, 1, 2.5);
    c.updateMatrixWorld(true);
    c.updateProjectionMatrix();
    const pts = projectStars(c, 1600, 1000);
    expect(pts).toHaveLength(CONSTELLATION.stars.length);
    expect(pts[2].visible).toBe(true);
    expect(pts[2].x).toBeGreaterThan(0);
    expect(pts[2].x).toBeLessThan(1600);
    const away = cam();
    away.lookAt(new Vector3(0, 0, 10)); // looking the other way
    away.updateMatrixWorld(true);
    expect(projectStars(away, 1600, 1000).every((p) => !p.visible)).toBe(true);
  });
});

describe("buildConstellation", () => {
  const uniforms = (m: Mesh) => (m.material as ShaderMaterial).uniforms;

  it("has one star per feature and one line between neighbours", () => {
    const { object } = buildConstellation(() => 0);
    for (let i = 0; i < CONSTELLATION.stars.length; i++) expect(object.getObjectByName(`feature-star-${i}`)).toBeTruthy();
    for (let i = 0; i < CONSTELLATION.stars.length - 1; i++) expect(object.getObjectByName(`feature-line-${i}`)).toBeTruthy();
  });

  it("lights the current star brightest and draws the lines as features are passed", () => {
    let feature = 0.2;
    const { object, update } = buildConstellation(() => feature);
    update!(0, 1 / 60);
    const glow = (i: number) => uniforms(object.getObjectByName(`feature-star-${i}`) as Mesh).uGlow.value as number;
    const reveal = (i: number) => uniforms(object.getObjectByName(`feature-line-${i}`) as Mesh).uReveal.value as number;
    expect(glow(0)).toBeGreaterThan(glow(1));
    expect(reveal(0)).toBe(0);
    feature = 2.2;
    update!(0, 1 / 60);
    expect(glow(2)).toBeGreaterThan(glow(0)); // the current one beats a passed one
    expect(glow(0)).toBeGreaterThan(glow(4)); // a passed one beats one still to come
    expect(reveal(0)).toBe(1);
    expect(reveal(1)).toBe(1);
    expect(reveal(3)).toBe(0);
  });
});
