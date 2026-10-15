import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Vector3 } from "three";
import { PALETTE } from "./palette";
import { CLOUDS, CLOUD_TEX, CLOUD_VARIANTS, buildClouds, cloudAzimuth, cloudEdgeFade, drawCloudMask, type Ctx2D } from "./clouds";

const clouds = (o: { children: unknown[] }) => o.children as Mesh[];

describe("cloudAzimuth", () => {
  it("drifts left and wraps round inside the dome", () => {
    const a0 = cloudAzimuth(0, 10, 1);
    expect(cloudAzimuth(5, 10, 1)).toBeCloseTo(a0 - 5);
    for (let t = 0; t < 400; t += 7.3) {
      const az = cloudAzimuth(t, 30, 0.9);
      expect(az).toBeGreaterThanOrEqual(CLOUDS.azMin);
      expect(az).toBeLessThan(CLOUDS.azMax);
    }
  });

  it("wraps from the left edge back to the right", () => {
    expect(cloudAzimuth(2, CLOUDS.azMin + 1, 1)).toBeGreaterThan(CLOUDS.azMax - 3);
  });
});

describe("cloudEdgeFade", () => {
  it("is invisible at the wrap edges and fully visible in the middle", () => {
    expect(cloudEdgeFade(CLOUDS.azMin)).toBe(0);
    expect(cloudEdgeFade(CLOUDS.azMax)).toBe(0);
    expect(cloudEdgeFade(0)).toBe(1);
  });
});

describe("buildClouds", () => {
  it("builds the configured number of single-quad clouds", () => {
    expect(clouds(buildClouds(PALETTE).object)).toHaveLength(CLOUDS.count);
  });

  it("keeps every cloud above the horizon on the far dome, at any time", () => {
    const { object, update } = buildClouds(PALETTE);
    for (let t = 0; t < 600; t += 13) {
      update!(t, 1 / 60);
      for (const m of clouds(object)) {
        const p = m.position;
        expect(p.length()).toBeCloseTo(CLOUDS.distance, 3);
        const el = (Math.asin(p.y / CLOUDS.distance) * 180) / Math.PI;
        expect(el).toBeGreaterThan(CLOUDS.elMin - 1);
        expect(el).toBeLessThan(CLOUDS.elMax + 1);
        expect(p.z).toBeLessThan(0); // in front of the camera, never behind it
      }
    }
  });

  it("faces the camera and fades at the edges", () => {
    const { object, update } = buildClouds(PALETTE);
    update!(0, 0);
    for (const m of clouds(object)) {
      const toCamera = m.position.clone().negate().normalize();
      const normal = new Vector3(0, 0, 1).applyQuaternion(m.quaternion);
      expect(normal.dot(toCamera)).toBeGreaterThan(0.999);
      const alpha = (m.material as MeshBasicMaterial).opacity;
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThanOrEqual(PALETTE.cloudAlpha);
    }
  });
});

/** A stand-in for a canvas context that records every point drawn and every fill colour used. */
function recorder() {
  const points: [number, number][] = [];
  const fills: string[] = [];
  let style = "";
  const ctx: Ctx2D = {
    get fillStyle() { return style; },
    set fillStyle(v: unknown) { style = String(v); },
    beginPath() {}, closePath() {},
    fill() { fills.push(style); },
    moveTo(x, y) { points.push([x, y]); },
    lineTo(x, y) { points.push([x, y]); },
    arc(x, y, r) { points.push([x - r, y - r], [x + r, y + r]); },
    bezierCurveTo(a, b, c, d, x, y) { points.push([a, b], [c, d], [x, y]); },
    fillRect() {},
  };
  return { ctx, points, fills };
}

describe("drawCloudMask", () => {
  it("draws white cloud shapes with black swirl cut-outs, inside the texture, for every variant", () => {
    for (let v = 0; v < CLOUD_VARIANTS.length; v++) {
      const { ctx, points, fills } = recorder();
      drawCloudMask(ctx, v, 100 + v);
      expect(fills).toContain("#fff");
      expect(fills).toContain("#000");
      expect(fills.lastIndexOf("#000")).toBeGreaterThan(fills.indexOf("#fff")); // cuts come after the body
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(-1);
        expect(x).toBeLessThanOrEqual(CLOUD_TEX.w + 1);
        expect(y).toBeGreaterThanOrEqual(-1);
        expect(y).toBeLessThanOrEqual(CLOUD_TEX.h + 1);
      }
    }
  });

  it("is deterministic for a seed", () => {
    const a = recorder(), b = recorder();
    drawCloudMask(a.ctx, 0, 7);
    drawCloudMask(b.ctx, 0, 7);
    expect(a.points).toEqual(b.points);
  });
});
