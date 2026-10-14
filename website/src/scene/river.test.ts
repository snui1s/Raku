import { describe, expect, it } from "vitest";
import { Mesh } from "three";
import { PALETTE } from "./palette";
import { hillHeight } from "./hill";
import { RIVER, buildRiver, riverDistance, riverWidthAt } from "./river";

describe("river path", () => {
  it("measures distance to the centerline", () => {
    const [x, z] = RIVER.points[3];
    expect(riverDistance(x, z)).toBeLessThan(0.05); // the centerline is sampled as a polyline
    expect(riverDistance(x + 20, z)).toBeGreaterThan(10);
  });

  it("flows toward the camera (z increases) and widens as it gets closer", () => {
    for (let i = 1; i < RIVER.points.length; i++) expect(RIVER.points[i][1]).toBeGreaterThan(RIVER.points[i - 1][1]);
    expect(riverWidthAt(1)).toBeGreaterThan(riverWidthAt(0));
    expect(riverWidthAt(0)).toBeGreaterThan(0.6);
    expect(riverWidthAt(1)).toBeLessThan(2.8);
  });
});

describe("buildRiver", () => {
  it("lies on the hill surface, just above it", () => {
    const { object } = buildRiver(PALETTE.light);
    const mesh = object.getObjectByName("river") as Mesh;
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 7) {
      const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      const d = y - hillHeight(x, z);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(0.2);
    }
  });

  it("works in both themes", () => {
    for (const p of [PALETTE.light, PALETTE.dark]) expect(buildRiver(p).object.getObjectByName("river")).toBeTruthy();
  });
});
