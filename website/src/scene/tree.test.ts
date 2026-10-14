import { describe, expect, it } from "vitest";
import { Box3, InstancedMesh, Vector3 } from "three";
import { PALETTE } from "./palette";
import { TREE, buildTree } from "./tree";

const first = (obj: { getObjectByName(n: string): unknown }, name: string, count = 10) => {
  const m = obj.getObjectByName(name) as InstancedMesh;
  return Array.from(m.instanceMatrix.array.slice(0, count * 16));
};

describe("buildTree", () => {
  it("is identical for the same seed", () => {
    const a = buildTree(PALETTE, undefined, 7);
    const b = buildTree(PALETTE, undefined, 7);
    expect(a.stats).toEqual(b.stats);
    for (const layer of ["blossoms-back", "blossoms-mid", "blossoms-front"]) {
      expect(first(a.object, layer)).toEqual(first(b.object, layer));
    }
  });

  it("changes with the seed", () => {
    const a = buildTree(PALETTE, undefined, 7);
    const b = buildTree(PALETTE, undefined, 8);
    expect(first(a.object, "blossoms-mid")).not.toEqual(first(b.object, "blossoms-mid"));
  });

  it("has 700 to 1000 blossoms and exactly 6 branches", () => {
    const { stats } = buildTree(PALETTE);
    expect(stats.blossoms).toBeGreaterThanOrEqual(700);
    expect(stats.blossoms).toBeLessThanOrEqual(1000);
    expect(stats.branches).toBe(6);
    expect(stats.leaves).toBeGreaterThan(0);
  });

  it("keeps the canopy above the trunk fork", () => {
    const { object } = buildTree(PALETTE);
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object.getObjectByName("canopy")!);
    expect(box.getCenter(new Vector3()).y).toBeGreaterThan(TREE.forkY);
  });
});
