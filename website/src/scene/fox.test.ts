import { describe, expect, it } from "vitest";
import { Box3, Object3D, PerspectiveCamera, Vector3 } from "three";
import { PALETTE } from "./palette";
import { hillHeight } from "./hill";
import { FOX, FOX_TAG, buildFox, foxCamera, foxLocalToWorld, lookAngles } from "./fox";

describe("buildFox", () => {
  const fox = () => {
    const part = buildFox(PALETTE);
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

  it("has a body", () => {
    expect(buildFox(PALETTE).object.getObjectByName("fox-body")).toBeTruthy();
  });
});

describe("the tag around the fox's neck", () => {
  const built = () => {
    const part = buildFox(PALETTE);
    part.object.updateMatrixWorld(true);
    return part;
  };
  const plaqueWorld = () => built().object.getObjectByName("fox-tag-plaque")!.getWorldPosition(new Vector3());

  it("has a cord around the neck, a tag, and cords holding it", () => {
    const { object } = built();
    for (const n of ["fox-tag", "fox-tag-plaque", "fox-neck-cord", "fox-tag-cord-l", "fox-tag-cord-r"]) expect(object.getObjectByName(n), n).toBeTruthy();
  });

  it("hangs where foxLocalToWorld says, in front of the chest", () => {
    const at = plaqueWorld();
    expect(at.distanceTo(foxLocalToWorld(FOX_TAG.local))).toBeLessThan(1e-6);
    const origin = foxLocalToWorld([0, 0, 0]);
    const facing = foxLocalToWorld([1, 0, 0]).sub(origin).normalize();
    expect(at.clone().sub(foxLocalToWorld([0.2, 0.47, 0])).dot(facing)).toBeGreaterThan(0.1); // in front of the chest
    expect(at.y).toBeGreaterThan(origin.y + 0.3); // up on the chest, not on the ground
  });

  it("sways a little, and never far", () => {
    const { object, update } = built();
    const tag = object.getObjectByName("fox-tag") as Object3D;
    for (let t = 0; t < 120; t += 0.31) {
      update!(t, 1 / 60);
      expect(Math.abs(tag.rotation.x)).toBeLessThan(0.2);
      expect(Math.abs(tag.rotation.z)).toBeLessThan(0.3);
    }
  });

  it("is framed by the fox camera: in the middle of the screen, and big enough to hold a button", () => {
    const pose = foxCamera();
    const cam = new PerspectiveCamera(pose.fov, 1.6, 0.1, 500);
    cam.position.copy(pose.position);
    cam.lookAt(pose.position.clone().add(pose.direction));
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    const centre = foxLocalToWorld(FOX_TAG.local).project(cam);
    expect(Math.abs(centre.x)).toBeLessThan(0.3);
    expect(centre.y).toBeLessThan(0.1); // low on the screen, so the face is above it
    expect(centre.y).toBeGreaterThan(-0.7);
    const [l, r] = [-1, 1].map((s) => foxLocalToWorld([FOX_TAG.local[0], FOX_TAG.local[1], s * FOX_TAG.halfWidth]).project(cam));
    expect(Math.abs(r.x - l.x) / 2).toBeGreaterThan(0.2); // at least a fifth of the screen width
    expect(pose.position.distanceTo(foxLocalToWorld(FOX_TAG.local))).toBeGreaterThan(0.8); // not too close for the near plane
  });

  it("is on the camera's side of the fox, so the face and the tag are what it sees", () => {
    const pose = foxCamera();
    const toCamera = pose.position.clone().sub(foxLocalToWorld([0.3, 0.84, 0])).normalize();
    const facing = foxLocalToWorld([1, 0, 0]).sub(foxLocalToWorld([0, 0, 0])).normalize();
    expect(toCamera.dot(facing)).toBeGreaterThan(0.6);
  });
});

describe("the fox reacts to the visitor", () => {
  const built = () => {
    const part = buildFox(PALETTE);
    part.object.updateMatrixWorld(true);
    return part;
  };
  const run = (part: ReturnType<typeof built>, seconds: number, t0 = 3) => {
    const tail = part.object.getObjectByName("fox-tail")!, earL = part.object.getObjectByName("fox-ear-l")!, earR = part.object.getObjectByName("fox-ear-r")!;
    let tailMax = 0, earMax = 0;
    for (let i = 0, t = t0; i < seconds * 60; i++, t += 1 / 60) {
      part.update!(t, 1 / 60);
      tailMax = Math.max(tailMax, Math.abs(tail.rotation.y));
      earMax = Math.max(earMax, Math.abs(earL.rotation.z), Math.abs(earR.rotation.z));
    }
    return { tailMax, earMax };
  };

  it("wags its tail and waggles its ears when clicked, far more than it idles", () => {
    const idle = built(), clicked = built();
    clicked.react();
    const a = run(idle, 1), b = run(clicked, 1);
    expect(b.tailMax).toBeGreaterThan(a.tailMax + 0.2);
    expect(b.earMax).toBeGreaterThan(a.earMax + 0.15);
    expect(b.tailMax).toBeLessThan(1); // lively, not wild
    expect(b.earMax).toBeLessThan(0.9);
  });

  it("settles back to its idle motion within a few seconds", () => {
    const part = built();
    part.react();
    run(part, 5);
    const after = run(part, 3, 8);
    expect(after.tailMax).toBeLessThan(0.4); // the idle bound
    expect(after.earMax).toBeLessThan(0.5);
  });

  it("can be clicked again while it is still excited", () => {
    const part = built();
    part.react();
    run(part, 0.5);
    part.react();
    expect(run(part, 0.5).tailMax).toBeGreaterThan(0.3);
  });

  it("turns its head toward a point it is told to look at, within limits, and back when told to stop", () => {
    const part = built();
    const head = part.object.getObjectByName("fox-head")!;
    part.look(foxLocalToWorld([2, 0.84, -1.5]));
    for (let i = 0; i < 120; i++) part.update!(i / 60, 1 / 60);
    expect(head.rotation.y).toBeGreaterThan(0.3);
    expect(head.rotation.y).toBeLessThanOrEqual(0.6 + 1e-9);
    part.look(foxLocalToWorld([2, 0.84, 1.5]));
    for (let i = 0; i < 120; i++) part.update!(2 + i / 60, 1 / 60);
    expect(head.rotation.y).toBeLessThan(-0.3);
    part.look(null);
    for (let i = 0; i < 240; i++) part.update!(4 + i / 60, 1 / 60);
    expect(Math.abs(head.rotation.y)).toBeLessThan(0.01);
  });

  it("looks straight ahead at a point straight ahead, and never twists round to look behind it", () => {
    const part = built();
    const head = part.object.getObjectByName("fox-head")!;
    part.look(foxLocalToWorld([5, 0.84, 0]));
    for (let i = 0; i < 180; i++) part.update!(i / 60, 1 / 60);
    expect(Math.abs(head.rotation.y)).toBeLessThan(0.02);
    part.look(foxLocalToWorld([-4, 0.84, -1]));
    for (let i = 0; i < 180; i++) part.update!(3 + i / 60, 1 / 60);
    expect(Math.abs(head.rotation.y)).toBeLessThanOrEqual(0.6 + 1e-9);
  });

  it("moves its head smoothly rather than snapping to the pointer", () => {
    const part = built();
    const head = part.object.getObjectByName("fox-head")!;
    part.look(foxLocalToWorld([2, 0.84, -1.5]));
    let prev = 0;
    for (let i = 0; i < 60; i++) {
      part.update!(i / 60, 1 / 60);
      expect(Math.abs(head.rotation.y - prev)).toBeLessThan(0.12);
      prev = head.rotation.y;
    }
  });
});

describe("lookAngles", () => {
  it("is zero for straight ahead, and signs follow the side and the height", () => {
    const ahead = lookAngles(new Vector3(1, 0, 0));
    expect(ahead.yaw).toBeCloseTo(0, 9);
    expect(ahead.pitch).toBeCloseTo(0, 9);
    expect(lookAngles(new Vector3(1, 0, -0.2)).yaw).toBeGreaterThan(0);
    expect(lookAngles(new Vector3(1, 0, 0.2)).yaw).toBeLessThan(0);
    expect(lookAngles(new Vector3(1, 0.2, 0)).pitch).toBeGreaterThan(0);
    expect(lookAngles(new Vector3(1, -0.2, 0)).pitch).toBeLessThan(0);
  });

  it("is limited in both directions, even for a point behind or straight above", () => {
    for (const v of [new Vector3(1, 0, -9), new Vector3(1, 0, 9), new Vector3(-1, 0, 0.1), new Vector3(0, 9, 0), new Vector3(0, -9, 0), new Vector3(0, 0, 0)]) {
      const a = lookAngles(v);
      expect(Number.isFinite(a.yaw + a.pitch)).toBe(true);
      expect(Math.abs(a.yaw)).toBeLessThanOrEqual(0.6 + 1e-9);
      expect(Math.abs(a.pitch)).toBeLessThanOrEqual(0.35 + 1e-9);
    }
  });
});
