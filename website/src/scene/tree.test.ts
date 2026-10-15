import { describe, expect, it } from "vitest";
import { Box3, InstancedMesh, Vector3 } from "three";
import { PALETTE } from "./palette";
import { BLOSSOM, TREE, buildTree, treeLocalToWorld } from "./tree";

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

describe("shaking the tree", () => {
  const canopyAngle = (t: number, dt: number, tree: ReturnType<typeof buildTree>) => {
    tree.update!(t, dt);
    return tree.object.getObjectByName("canopy")!.rotation.z;
  };

  it("is named so the page can tell a click on it from a click on anything else", () => {
    expect(buildTree(PALETTE).object.name).toBe("tree");
  });

  it("shudders for a moment and then settles back to its normal sway", () => {
    const tree = buildTree(PALETTE);
    const calm = canopyAngle(5, 0, tree);
    tree.shake();
    let biggest = 0;
    for (let i = 1; i <= 60; i++) biggest = Math.max(biggest, Math.abs(canopyAngle(5, 1 / 60, tree) - calm));
    expect(biggest).toBeGreaterThan(0.01); // visible
    expect(biggest).toBeLessThan(0.08); // but not a wreck
    for (let i = 0; i < 300; i++) canopyAngle(5, 1 / 60, tree);
    expect(Math.abs(canopyAngle(5, 1 / 60, tree) - calm)).toBeLessThan(1e-3);
  });

  it("does nothing until it is shaken, and a second shake starts the shudder again", () => {
    const tree = buildTree(PALETTE);
    const a = canopyAngle(2, 1 / 60, tree), b = canopyAngle(2, 1 / 60, tree);
    expect(a).toBe(b);
    tree.shake();
    for (let i = 0; i < 200; i++) canopyAngle(2, 1 / 60, tree);
    tree.shake();
    let moved = 0;
    for (let i = 0; i < 30; i++) moved = Math.max(moved, Math.abs(canopyAngle(2, 1 / 60, tree) - a));
    expect(moved).toBeGreaterThan(0.01);
  });

  it("has its blossom up in the canopy, in front of the camera side of the trunk", () => {
    const p = treeLocalToWorld(BLOSSOM.local);
    expect(p.y).toBeGreaterThan(treeLocalToWorld([0, TREE.forkY, 0]).y);
    expect(BLOSSOM.radius).toBeGreaterThan(2);
  });
});
