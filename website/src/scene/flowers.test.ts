import { describe, expect, it } from "vitest";
import { InstancedMesh, PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { FOX } from "./fox";
import { hillHeight } from "./hill";
import { PALETTE } from "./palette";
import { riverDistance, riverWidthAt } from "./river";
import { TORII } from "./torii";
import { TREE } from "./tree";
import { FLOWERS, POPPY_COLORS, buildFlowers, scatterFlowers } from "./flowers";

const flowers = scatterFlowers(3);

describe("scatterFlowers", () => {
  it("makes the configured number of black-eyed Susans and poppies", () => {
    expect(flowers.filter((f) => f.kind === "susan")).toHaveLength(FLOWERS.susan);
    expect(flowers.filter((f) => f.kind === "poppy")).toHaveLength(FLOWERS.poppy);
  });

  it("plants every flower on the hill, in view, off the water and clear of the big objects", () => {
    const cam = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    cam.position.set(...CAMERA.position);
    cam.lookAt(new Vector3(...CAMERA.target));
    cam.updateMatrixWorld(true);
    const th = (TORII.yawDeg * Math.PI) / 180, A = TORII.halfSpan;
    const feet: [number, number][] = [
      [TORII.position[0] - A * Math.cos(th), TORII.position[2] - A * Math.sin(th)],
      [TORII.position[0] + A * Math.cos(th), TORII.position[2] + A * Math.sin(th)],
    ];
    for (const f of flowers) {
      expect(Math.abs(f.y - hillHeight(f.x, f.z))).toBeLessThan(0.05);
      const ndc = new Vector3(f.x, f.y, f.z).project(cam);
      expect(Math.abs(ndc.x)).toBeLessThan(1.25);
      expect(ndc.y).toBeLessThan(0);
      expect(riverDistance(f.x, f.z)).toBeGreaterThan(riverWidthAt(1) / 2);
      expect(Math.hypot(f.x - FOX.position[0], f.z - FOX.position[2])).toBeGreaterThan(0.9);
      expect(Math.hypot(f.x - TREE.position[0], f.z - TREE.position[2])).toBeGreaterThan(1.8);
      for (const [fx, fz] of feet) expect(Math.hypot(f.x - fx, f.z - fz)).toBeGreaterThan(0.6);
    }
  });

  it("uses several poppy colors and is deterministic", () => {
    const used = new Set(flowers.filter((f) => f.kind === "poppy").map((f) => f.color));
    expect(used.size).toBeGreaterThanOrEqual(5);
    for (const c of used) expect(POPPY_COLORS).toContain(c);
    expect(scatterFlowers(3)[10]).toEqual(flowers[10]);
    expect(scatterFlowers(4)[10]).not.toEqual(flowers[10]);
  });
});

describe("buildFlowers", () => {
  it("has stems plus one instanced mesh per flower kind, sized to match", () => {
    const { object } = buildFlowers(PALETTE.light);
    const count = (n: string) => (object.getObjectByName(n) as InstancedMesh).count;
    expect(count("flower-stems")).toBe(FLOWERS.susan + FLOWERS.poppy);
    expect(count("susan-heads")).toBe(FLOWERS.susan);
    expect(count("poppy-heads")).toBe(FLOWERS.poppy);
  });

  it("sways with the wind without moving the roots", () => {
    const { object, update } = buildFlowers(PALETTE.light);
    const heads = object.getObjectByName("poppy-heads") as InstancedMesh;
    const before = Array.from(heads.instanceMatrix.array.slice(0, 16));
    update!(20, 1 / 60);
    const after = Array.from(heads.instanceMatrix.array.slice(0, 16));
    expect(after).not.toEqual(before);
    const stems = object.getObjectByName("flower-stems") as InstancedMesh;
    const a = Array.from(stems.instanceMatrix.array.slice(12, 15));
    update!(40, 1 / 60);
    expect(Array.from(stems.instanceMatrix.array.slice(12, 15))).toEqual(a); // translation (the root) is unchanged
  });
});
