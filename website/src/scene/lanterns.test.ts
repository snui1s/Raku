import { describe, expect, it } from "vitest";
import { Box3, Group, PerspectiveCamera, Vector3 } from "three";
import { TREE_VIEW } from "./journey";
import { hillHeight } from "./hill";
import { TREE, branchPointWorld, buildTree, treeLocalToWorld } from "./tree";
import { activateSceneHit } from "./interact";
import { PALETTE } from "./palette";
import { LANTERNS, LANTERN_ATTACH, LANTERN_CORDS, buildLanterns } from "./lanterns";

const treeCamera = () => {
  const cam = new PerspectiveCamera(TREE_VIEW.fov, 1.6, 0.1, 500);
  cam.position.copy(TREE_VIEW.position);
  cam.lookAt(TREE_VIEW.position.clone().add(TREE_VIEW.direction));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

describe("buildLanterns", () => {
  it("follows the shaking branches with all cords attached and lets each lantern swing and settle", () => {
    const tree = buildTree(PALETTE), lanterns = buildLanterns(), world = new Group();
    world.add(tree.object, lanterns.object);
    tree.object.attach(lanterns.object);
    const localAnchors = LANTERN_ATTACH.map((p) => tree.object.worldToLocal(p.clone()));
    const run = (dt: number) => { tree.update!(5, dt); lanterns.update!(5, dt); world.updateMatrixWorld(true); };
    run(0);
    const restingCentres = lanterns.centres();
    const restingAngles = localAnchors.map((_, i) => lanterns.object.getObjectByName(`lantern-${i}`)!.rotation.z);
    activateSceneHit({ kind: "tree", point: treeLocalToWorld([0, 5, 0]) }, {
      tree, blossom: treeLocalToWorld([0, 7, 0]), stars: [],
    });
    const travel = [0, 0, 0, 0], angles = [0, 0, 0, 0];
    let trunk = 0;
    for (let frame = 0; frame < 120; frame++) {
      run(1 / 60);
      trunk = Math.max(trunk, Math.abs(tree.object.rotation.z));
      const centres = lanterns.centres();
      localAnchors.forEach((local, i) => {
        const l = lanterns.object.getObjectByName(`lantern-${i}`)!;
        expect(l.getWorldPosition(new Vector3()).distanceTo(tree.object.localToWorld(local.clone()))).toBeLessThan(1e-9);
        angles[i] = Math.max(angles[i], Math.abs(l.rotation.z - restingAngles[i]));
        travel[i] = Math.max(travel[i], centres[i].distanceTo(restingCentres[i]));
      });
    }
    expect(trunk).toBeGreaterThan(0.005);
    travel.forEach((d) => expect(d).toBeGreaterThan(0.02));
    angles.forEach((a) => expect(a).toBeGreaterThan(0.005));
    const current = lanterns.centres();
    tree.shake();
    run(0);
    lanterns.centres().forEach((p, i) => expect(p.distanceTo(current[i])).toBeLessThan(1e-9));
    for (let i = 0; i < 1200; i++) run(1 / 60);
    lanterns.centres().forEach((p, i) => expect(p.distanceTo(restingCentres[i])).toBeLessThan(0.001));
  });

  it("has four lanterns, one for each number", () => {
    const { object } = buildLanterns();
    for (let i = 0; i < 4; i++) expect(object.getObjectByName(`lantern-${i}`), `lantern ${i}`).toBeTruthy();
    expect(LANTERNS).toHaveLength(4);
  });

  it("is always there, full size, from the first frame: the numbers chapter zooms in on them instead of making them appear", () => {
    const { object, update } = buildLanterns();
    for (const t of [undefined, 0, 12.5]) {
      if (t !== undefined) update!(t, 1 / 60);
      for (let i = 0; i < 4; i++) {
        const l = object.getObjectByName(`lantern-${i}`)!;
        expect(l.visible).toBe(true);
        expect(l.scale.x).toBe(1);
      }
    }
  });

  it("is part of the scene the stills are rendered from, so the hero picture shows them too", async () => {
    const src = await import("node:fs").then((fs) => fs.readFileSync(new URL("./index.ts", import.meta.url), "utf8"));
    expect(src).toMatch(/BUILDERS[\s\S]*buildLanterns\(\)/);
  });

  it("is tied to the tree: each cord starts on a branch and the lantern hangs straight below it", () => {
    const { object } = buildLanterns();
    object.updateMatrixWorld(true);
    const near = (a: Vector3, b: Vector3) => a.distanceTo(b) < 1e-6;
    const branches = [0, 2];
    LANTERN_ATTACH.forEach((attach, i) => {
      // the attach point is exactly a point on one of the tree's branches
      const onBranch = branches.some((b) => Array.from({ length: 101 }, (_, k) => branchPointWorld(b, k / 100)).some((p) => near(p, attach)));
      expect(onBranch, `lantern ${i} is tied to a branch`).toBe(true);
      const l = object.getObjectByName(`lantern-${i}`)!;
      expect(near(l.position, attach)).toBe(true);
      const body = object.getObjectByName(`lantern-${i}-body`)!.getWorldPosition(new Vector3());
      expect(body.distanceTo(new Vector3(...LANTERNS[i]))).toBeLessThan(1e-6);
      expect(body.x).toBeCloseTo(attach.x, 6); // straight down
      expect(LANTERN_CORDS[i], `cord ${i}`).toBeGreaterThan(0.3);
      expect(LANTERN_CORDS[i], `cord ${i}`).toBeLessThan(3.5);
    });
  });

  it("hangs clear of the ground, and under the blossoms rather than inside them", () => {
    const canopyBottom = treeLocalToWorld([0, 4.6, 0]).y;
    LANTERNS.forEach(([x, y, z], i) => {
      expect(y, `lantern ${i} above the ground`).toBeGreaterThan(hillHeight(x, z) + 1.5);
      expect(y + 0.5, `lantern ${i} top is below the canopy`).toBeLessThan(canopyBottom + 0.3);
      expect(Math.abs(x - TREE.position[0]), `lantern ${i} is not on the trunk`).toBeGreaterThan(1.2);
    });
  });

  it("sways from the branch, only a little", () => {
    const { object, update } = buildLanterns();
    for (let t = 0; t < 60; t += 0.7) {
      update!(t, 1 / 60);
      LANTERN_ATTACH.forEach((a, i) => {
        const l = object.getObjectByName(`lantern-${i}`)!;
        expect(l.position.distanceTo(a)).toBeLessThan(1e-9); // the tie point never moves
        expect(Math.abs(l.rotation.z)).toBeLessThan(0.25);
      });
    }
  });

  it("all four are in view from the tree camera, and their numbers do not overlap", () => {
    const cam = treeCamera();
    const ndc = LANTERNS.map((p) => new Vector3(...p).project(cam));
    ndc.forEach((v, i) => {
      expect(Math.abs(v.x), `lantern ${i} x`).toBeLessThan(0.85);
      expect(v.y, `lantern ${i} y`).toBeLessThan(0.75);
      expect(v.y, `lantern ${i} y`).toBeGreaterThan(-0.3); // the number goes under it, so leave room below
    });
    // each number sits under its lantern in a chip about 0.24 wide and 0.2 tall (screen units, -1..1)
    const chip = LANTERNS.map((p) => {
      const c = new Vector3(p[0], p[1] - 0.8, p[2]).project(cam);
      return new Box3(new Vector3(c.x - 0.12, c.y - 0.2, 0), new Vector3(c.x + 0.12, c.y, 0));
    });
    for (let i = 0; i < chip.length; i++) for (let j = i + 1; j < chip.length; j++) expect(chip[i].intersectsBox(chip[j]), `numbers ${i} and ${j}`).toBe(false);
  });

  it("is a warm light colour", () => {
    const { object } = buildLanterns();
    const body = object.getObjectByName("lantern-0-body") as unknown as { material: { color: { r: number; b: number } } };
    expect(body.material.color.r).toBeGreaterThan(body.material.color.b);
  });
});
