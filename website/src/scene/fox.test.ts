import { describe, expect, it } from "vitest";
import { Box3, Object3D, Vector3 } from "three";
import { PALETTE } from "./palette";
import { hillHeight } from "./hill";
import { FOX, buildFox } from "./fox";

describe("buildFox", () => {
  const fox = () => {
    const part = buildFox(PALETTE.light);
    part.object.updateMatrixWorld(true);
    return part;
  };

  it("has the named parts", () => {
    const { object } = fox();
    for (const n of ["fox-body", "fox-head", "fox-tail", "fox-ear-l", "fox-ear-r"]) expect(object.getObjectByName(n), n).toBeTruthy();
  });

  it("is a small animal sitting on the hill", () => {
    const { object } = fox();
    const box = new Box3().setFromObject(object);
    expect(box.max.y - box.min.y).toBeGreaterThan(0.6);
    expect(box.max.y - box.min.y).toBeLessThan(1.8);
    expect(Math.abs(box.min.y - hillHeight(FOX.position[0], FOX.position[2]))).toBeLessThan(0.2);
  });

  it("keeps its idle motion small and repeatable", () => {
    const { object, update } = fox();
    const tail = object.getObjectByName("fox-tail") as Object3D;
    const earR = object.getObjectByName("fox-ear-r") as Object3D;
    const base = earR.rotation.z;
    for (let t = 0; t < 120; t += 0.37) {
      update!(t, 1 / 60);
      expect(Math.abs(tail.rotation.y)).toBeLessThan(0.4);
      expect(Math.abs(earR.rotation.z - base)).toBeLessThan(0.5);
    }
    update!(12.5, 1 / 60);
    const a = tail.rotation.y;
    update!(12.5, 1 / 60);
    expect(tail.rotation.y).toBe(a);
  });

  it("sits at the chosen spot, facing left and a little toward the camera, with the tail on the camera side", () => {
    const { object } = fox();
    const world = (n: string) => object.getObjectByName(n)!.getWorldPosition(new Vector3());
    const head = world("fox-head"), tail = world("fox-tail"), root = object.getWorldPosition(new Vector3());
    expect(root.x).toBeCloseTo(FOX.position[0], 5);
    expect(root.z).toBeCloseTo(FOX.position[2], 5);
    expect(head.x).toBeLessThan(tail.x - 0.3); // the head is left of the tail
    expect(head.z).toBeGreaterThan(tail.z); // and nearer to the camera
    const tailTip = new Box3().setFromObject(object.getObjectByName("fox-tail")!).getCenter(new Vector3());
    expect(tailTip.z).toBeGreaterThan(root.z); // the curled tail is on the camera side, not hidden behind the body
  });

  it("works in both themes", () => {
    for (const p of [PALETTE.light, PALETTE.dark]) expect(buildFox(p).object.getObjectByName("fox-body")).toBeTruthy();
  });
});
