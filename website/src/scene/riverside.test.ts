import { describe, expect, it } from "vitest";
import { InstancedMesh, type Object3D } from "three";
import { hillHeight } from "./hill";
import { PALETTE } from "./palette";
import { riverDistance, riverFrame, riverWidthAt } from "./river";
import { RIVERSIDE, buildRiverside, riverPoint } from "./riverside";

describe("riverPoint", () => {
  it("is on the river centre at offset 0 and on the ground", () => {
    for (const u of [0.5, 0.7, 0.95]) {
      const p = riverPoint(u, 0);
      expect(riverDistance(p.x, p.z)).toBeLessThan(0.06);
      expect(p.y).toBeCloseTo(hillHeight(p.x, p.z));
    }
  });

  it("sits the given distance from the centre line", () => {
    const u = 0.8, half = riverWidthAt(u) / 2;
    const left = riverPoint(u, half), right = riverPoint(u, -half);
    const c = riverFrame(u).point;
    expect(Math.hypot(left.x - c.x, left.z - c.z)).toBeCloseTo(half, 3);
    expect(Math.hypot(left.x - right.x, left.z - right.z)).toBeCloseTo(half * 2, 3);
  });
});

describe("buildRiverside", () => {
  const build = () => buildRiverside(PALETTE);
  const find = (o: Object3D, name: string) => {
    const out: Object3D[] = [];
    o.traverse((c) => { if (c.name === name) out.push(c); });
    return out;
  };

  it("has the configured stones, reeds, cattails, pads and floating petals", () => {
    const { object } = build();
    expect((find(object, "river-stones")[0] as InstancedMesh).count).toBe(RIVERSIDE.bankStones + RIVERSIDE.streamStones);
    expect((find(object, "reeds")[0] as InstancedMesh).count).toBe(RIVERSIDE.reedClumps * RIVERSIDE.bladesPerClump);
    expect((find(object, "cattails")[0] as InstancedMesh).count).toBe(RIVERSIDE.reedClumps * 2);
    expect(find(object, "lily-pad")).toHaveLength(RIVERSIDE.pads);
    expect(find(object, "floating-petal")).toHaveLength(RIVERSIDE.floatingPetals);
  });

  it("is deterministic for a seed", () => {
    const a = build().object.getObjectByName("river-stones") as InstancedMesh;
    const b = build().object.getObjectByName("river-stones") as InstancedMesh;
    expect(Array.from(a.instanceMatrix.array)).toEqual(Array.from(b.instanceMatrix.array));
  });

  it("keeps the stones beside or in the river, on the ground", () => {
    const stones = build().object.getObjectByName("river-stones") as InstancedMesh;
    for (let i = 0; i < stones.count; i++) {
      const x = stones.instanceMatrix.array[i * 16 + 12], y = stones.instanceMatrix.array[i * 16 + 13], z = stones.instanceMatrix.array[i * 16 + 14];
      expect(riverDistance(x, z)).toBeLessThan(riverWidthAt(1) / 2 + 0.7);
      expect(y - hillHeight(x, z)).toBeGreaterThan(-0.05);
      expect(y - hillHeight(x, z)).toBeLessThan(0.35);
    }
  });

  it("makes the stones cast and receive shadows", () => {
    const stones = build().object.getObjectByName("river-stones") as InstancedMesh;
    expect(stones.castShadow).toBe(true);
    expect(stones.receiveShadow).toBe(true);
  });

  it("floats petals on the water and keeps them inside the visible stretch as they drift", () => {
    const { object, update } = build();
    for (const t of [0, 20, 77, 300]) {
      update!(t, 1 / 60);
      for (const m of find(object, "floating-petal")) {
        expect(riverDistance(m.position.x, m.position.z)).toBeLessThan(riverWidthAt(1) / 2 + 0.05);
        expect(m.position.y - hillHeight(m.position.x, m.position.z)).toBeGreaterThan(0.05);
        expect(m.scale.x).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
