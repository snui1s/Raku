import { describe, expect, it } from "vitest";
import { InstancedMesh, Matrix4, Vector3 } from "three";
import { PALETTE } from "./palette";
import { hillHeight } from "./hill";
import { buildGrass } from "./grass";
import { riverDistance, riverWidthAt } from "./river";

describe("buildGrass", () => {
  it("builds three layers with about 230 or more blades", () => {
    const { object, count } = buildGrass(PALETTE);
    const layers = object.children.filter((c) => (c as InstancedMesh).isInstancedMesh);
    expect(layers).toHaveLength(3);
    expect(count).toBeGreaterThanOrEqual(230);
  });

  it("plants every sampled blade on the hill surface", () => {
    const { object } = buildGrass(PALETTE);
    const mesh = object.children[0] as InstancedMesh;
    const m = new Matrix4(), p = new Vector3();
    for (let i = 0; i < 40; i++) {
      mesh.getMatrixAt(i, m);
      p.setFromMatrixPosition(m);
      expect(Math.abs(p.y - hillHeight(p.x, p.z))).toBeLessThan(0.15);
    }
  });

  it("is deterministic for a seed", () => {
    const a = buildGrass(PALETTE, undefined, 5).object.children[0] as InstancedMesh;
    const b = buildGrass(PALETTE, undefined, 5).object.children[0] as InstancedMesh;
    expect(Array.from(a.instanceMatrix.array.slice(0, 160))).toEqual(Array.from(b.instanceMatrix.array.slice(0, 160)));
  });
});

describe("grass and the river", () => {
  it("keeps every blade off the water", () => {
    const { object } = buildGrass(PALETTE);
    const m = new Matrix4(), p = new Vector3();
    for (const layer of object.children as InstancedMesh[]) {
      for (let i = 0; i < layer.count; i++) {
        layer.getMatrixAt(i, m);
        p.setFromMatrixPosition(m);
        expect(riverDistance(p.x, p.z)).toBeGreaterThan(riverWidthAt(0.6) / 2);
      }
    }
  });
});
