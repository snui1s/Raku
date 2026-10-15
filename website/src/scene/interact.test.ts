import { describe, expect, it } from "vitest";
import { Group, Mesh, Vector3 } from "three";
import { activateSceneHit, classifyHit, createSceneTap, nearestPoint, pointerWind } from "./interact";
import { buildFox } from "./fox";
import { buildTree } from "./tree";
import { buildPetals } from "./petals";
import { buildShootingStars } from "./shootingstar";
import { PALETTE } from "./palette";
import { pushedWind } from "./wind";

describe("scene taps", () => {
  it("requires a release on the same object and the same star", () => {
    const tap = createSceneTap();
    tap.begin(1, 10, 10, { kind: "fox" });
    expect(tap.end(1, 12, 12, { kind: "fox" })).toEqual({ kind: "fox" });
    tap.begin(1, 10, 10, { kind: "fox" });
    expect(tap.end(1, 10, 10, { kind: "tree", point: new Vector3() })).toBeNull();
    tap.begin(1, 10, 10, { kind: "star", index: 0 });
    expect(tap.end(1, 10, 10, { kind: "star", index: 1 })).toBeNull();
  });

  it("does not activate after dragging away and back, cancellation, or another pointer's release", () => {
    const tap = createSceneTap(), hit = { kind: "fox" } as const;
    tap.begin(1, 10, 10, hit);
    tap.move(1, 30, 10);
    expect(tap.end(1, 10, 10, hit)).toBeNull();
    tap.begin(1, 10, 10, hit);
    tap.cancel();
    expect(tap.end(1, 10, 10, hit)).toBeNull();
    tap.begin(1, 10, 10, hit);
    expect(tap.end(2, 10, 10, hit)).toBeNull();
    expect(tap.end(1, 10, 10, null)).toBeNull();
  });
});

describe("independent model reactions", () => {
  it("keeps the fox, tree, petals and stars running when another model is clicked", () => {
    const fox = buildFox(PALETTE), tree = buildTree(PALETTE), petals = buildPetals(PALETTE);
    const shooting = buildShootingStars(() => 0.5), controlFox = buildFox(PALETTE), controlTree = buildTree(PALETTE);
    const blossom = new Vector3(8, 8, -19.5), stars = [new Vector3(-60, 120, -170)];
    const targets = { fox, tree, petals, shooting, blossom, stars };
    const angle = (part: typeof fox | typeof tree, name: string) => part.object.getObjectByName(name)!.rotation.toArray();
    activateSceneHit({ kind: "fox" }, targets);
    controlFox.react();
    fox.update!(1, 0.1); controlFox.update!(1, 0.1);
    const wind = pushedWind();
    activateSceneHit({ kind: "tree", point: blossom }, targets);
    controlTree.shake();
    expect(pushedWind()).toBe(wind);
    fox.update!(1.1, 0.1); controlFox.update!(1.1, 0.1);
    tree.update!(1.1, 0.1); controlTree.update!(1.1, 0.1);
    petals.update!(1.1, 0.1);
    expect(angle(fox, "fox-tail")).toEqual(angle(controlFox, "fox-tail"));
    const petalMatrices = (petals.object as import("three").InstancedMesh).instanceMatrix.array.slice();
    activateSceneHit({ kind: "star", index: 0 }, targets);
    shooting.update!(1.1, 0.1);
    const flight = shooting.object.children[0].children[0].position.clone();
    activateSceneHit({ kind: "fox" }, targets);
    expect(shooting.object.children[0].children[0].position).toEqual(flight);
    expect((petals.object as import("three").InstancedMesh).instanceMatrix.array).toEqual(petalMatrices);
    tree.update!(1.2, 0.1); controlTree.update!(1.2, 0.1);
    expect(angle(tree, "canopy")).toEqual(angle(controlTree, "canopy"));
    petals.update!(1.2, 0.1);
    expect((petals.object as import("three").InstancedMesh).instanceMatrix.array).not.toEqual(petalMatrices);
    shooting.update!(1.2, 0.1);
    expect(shooting.object.children[0].children[0].position).not.toEqual(flight);
  });
});

describe("nearestPoint", () => {
  const pts = [
    { x: 100, y: 100, visible: true },
    { x: 130, y: 100, visible: true },
    { x: 105, y: 102, visible: false },
  ];

  it("finds the closest visible point within reach", () => {
    expect(nearestPoint(pts, 128, 101, 20)).toBe(1);
    expect(nearestPoint(pts, 101, 99, 20)).toBe(0);
  });

  it("ignores points that are not visible, even when they are the closest", () => {
    expect(nearestPoint(pts, 105, 102, 20)).toBe(0);
  });

  it("returns -1 when nothing is within reach, or there are no points", () => {
    expect(nearestPoint(pts, 300, 300, 20)).toBe(-1);
    expect(nearestPoint([], 0, 0, 20)).toBe(-1);
    expect(nearestPoint(pts, 115, 100, 5)).toBe(-1);
  });

  it("picks the nearer of two that are both in reach", () => {
    expect(nearestPoint(pts, 114, 100, 30)).toBe(0);
    expect(nearestPoint(pts, 116, 100, 30)).toBe(1);
  });
});

describe("classifyHit", () => {
  const tree = (() => { const g = new Group(), inner = new Group(), m = new Mesh(); g.name = "tree"; g.add(inner); inner.add(m); return m; })();
  const fox = (() => { const g = new Group(), m = new Mesh(); g.name = "fox"; g.add(m); return m; })();
  const hill = (() => { const g = new Group(), m = new Mesh(); g.name = "hill"; g.add(m); return m; })();

  it("tells the fox and the tree from anything else, whatever is hit inside them", () => {
    expect(classifyHit(fox)).toBe("fox");
    expect(classifyHit(tree)).toBe("tree");
  });

  it("calls anything else an obstacle, and nothing at all nothing", () => {
    expect(classifyHit(hill)).toBe("other");
    expect(classifyHit(new Mesh())).toBe("other");
    expect(classifyHit(null)).toBeNull();
  });
});

describe("pointerWind", () => {
  it("is nothing for a slow drift or no movement", () => {
    expect(pointerWind(0, 16)).toBe(0);
    expect(pointerWind(5, 16)).toBe(0); // 0.3 px per ms
    expect(pointerWind(10, 0)).toBe(0);
    expect(pointerWind(-4, 16)).toBe(0);
  });

  it("grows with a quicker, longer sweep, and one event never adds more than 0.3", () => {
    expect(pointerWind(40, 16)).toBeGreaterThan(0);
    expect(pointerWind(120, 16)).toBeGreaterThan(pointerWind(40, 16));
    expect(pointerWind(5000, 16)).toBe(0.3);
  });
});
