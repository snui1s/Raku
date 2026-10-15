import {
  ConeGeometry, CubicBezierCurve3, CylinderGeometry, Euler, ExtrudeGeometry, Group, Matrix4, Mesh, MeshToonMaterial, Quaternion,
  Shape, SphereGeometry, TorusGeometry, Vector3, type Texture,
} from "three";
import { hillHeight } from "./hill";
import { windGust } from "./wind";
import { taperedTube } from "./tree";
import { lookPose, type Pose } from "./journey";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** A fox sitting on the hill between the gate and the tree, facing left and a little toward the camera. */
export const FOX = { position: [4.45, 0, -14.2] as [number, number, number], yaw: -2.6 };
/** Stylized: bigger than life so it reads from across the hill. z is mirrored so that, turned to face left,
 *  the curled tail stays on the camera side (three.js flips the face winding for mirrored objects). */
const FOX_SCALE = [1.25, 1.25, -1.25] as const;

/** Fox-local coordinates (x forward, y up, z to the side) to world coordinates. */
export function foxLocalToWorld(local: [number, number, number]): Vector3 {
  const [fx, , fz] = FOX.position;
  const m = new Matrix4().compose(
    new Vector3(fx, hillHeight(fx, fz) - 0.02, fz),
    new Quaternion().setFromEuler(new Euler(0, FOX.yaw, 0)),
    new Vector3(...FOX_SCALE),
  );
  return new Vector3(...local).applyMatrix4(m);
}

/** The wooden tag (an ema, like the prayer tablets at a shrine) on the fox's chest, in fox-local coordinates. */
export const FOX_TAG = { hang: [0.4, 0.68, 0] as [number, number, number], local: [0.42, 0.5, 0] as [number, number, number], halfWidth: 0.2 };

/** The close-up for the download: in front of the fox, low, with the face above the tag. */
export function foxCamera(): Pose {
  const p = foxLocalToWorld([1.5, 0.78, 0.2]), t = foxLocalToWorld([0.4, 0.66, 0]);
  return lookPose([p.x, p.y, p.z], [t.x, t.y, t.z], 38);
}

export function buildFox(palette: Palette, toon?: Texture): ScenePart {
  const mat = (c: number) => new MeshToonMaterial({ color: c, gradientMap: toon ?? null });
  const fur = mat(palette.fox[0]), cream = mat(palette.fox[1]), dark = mat(palette.fox[2]);
  const root = new Group();
  root.name = "fox";

  const ball = (m: MeshToonMaterial, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) => {
    const mesh = new Mesh(new SphereGeometry(1, 20, 14), m);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // body: tilted so the chest is high and the rump is low, as when sitting
  const body = ball(fur, 0.36, 0.34, 0.26, -0.02, 0.4, 0, root, "fox-body");
  body.rotation.z = 0.5;
  ball(cream, 0.2, 0.27, 0.2, 0.2, 0.47, 0); // chest
  [-1, 1].forEach((s) => {
    ball(fur, 0.22, 0.22, 0.12, -0.14, 0.23, s * 0.17); // haunch
    ball(dark, 0.14, 0.05, 0.075, 0.0, 0.05, s * 0.17); // hind paw
    const leg = new Mesh(new CylinderGeometry(0.045, 0.05, 0.4, 10), fur); // front leg
    leg.position.set(0.22, 0.24, s * 0.09);
    root.add(leg);
    const sock = new Mesh(new CylinderGeometry(0.05, 0.052, 0.17, 10), dark);
    sock.position.set(0.22, 0.09, s * 0.09);
    root.add(sock);
    ball(dark, 0.075, 0.04, 0.06, 0.25, 0.03, s * 0.09);
  });

  // head
  const head = new Group();
  head.name = "fox-head";
  head.position.set(0.3, 0.84, 0);
  root.add(head);
  ball(fur, 0.17, 0.155, 0.16, 0, 0, 0, head);
  [-1, 1].forEach((s) => ball(cream, 0.11, 0.075, 0.075, 0.03, -0.06, s * 0.1, head)); // cheeks
  const snout = new Mesh(new ConeGeometry(0.075, 0.22, 14), fur);
  snout.rotation.z = -Math.PI / 2; // cone points along +x
  snout.position.set(0.2, -0.04, 0);
  head.add(snout);
  ball(cream, 0.1, 0.04, 0.05, 0.19, -0.075, 0, head);
  ball(dark, 0.03, 0.026, 0.03, 0.315, -0.035, 0, head); // nose
  const eyes = [-1, 1].map((s) => ball(dark, 0.02, 0.022, 0.014, 0.1, 0.035, s * 0.115, head));
  const ears = [-1, 1].map((s) => {
    const ear = new Group();
    ear.name = s < 0 ? "fox-ear-l" : "fox-ear-r";
    ear.position.set(-0.02, 0.14, s * 0.1);
    ear.rotation.x = -s * 0.3; // leaned outward
    const outer = new Mesh(new ConeGeometry(0.075, 0.24, 12), fur);
    outer.position.y = 0.11;
    const tip = new Mesh(new ConeGeometry(0.05, 0.11, 12), dark);
    tip.position.y = 0.19;
    ear.add(outer, tip);
    head.add(ear);
    return ear;
  });

  // tail: bushy, curled around the feet, with a cream tip
  const tail = new Group();
  tail.name = "fox-tail";
  tail.position.set(-0.3, 0.2, 0.03);
  const curve = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(-0.42, -0.12, 0.2), new Vector3(-0.2, -0.17, 0.5), new Vector3(0.38, -0.16, 0.42));
  tail.add(new Mesh(taperedTube(curve, 0.07, 0.12, 22, 12), fur));
  const tip = ball(cream, 0.1, 0.09, 0.1, 0.4, -0.16, 0.43, tail);
  tip.scale.set(0.13, 0.1, 0.1);
  root.add(tail);

  // the tag: a cord around the neck, and a wooden plaque hanging from it on two cords
  const wood = mat(0xb98552), cordMat = mat(palette.accent);
  const ring = new Group(); // leaned to follow the neck
  ring.position.set(0.27, 0.7, 0);
  ring.rotation.z = -0.35;
  const neck = new Mesh(new TorusGeometry(0.15, 0.013, 8, 28), cordMat);
  neck.name = "fox-neck-cord";
  neck.rotation.x = Math.PI / 2;
  ring.add(neck);
  root.add(ring);

  const tag = new Group(); // pivots at the point where the cords meet
  tag.name = "fox-tag";
  tag.position.set(...FOX_TAG.hang);
  const [hx, hy] = FOX_TAG.hang, [px, py] = FOX_TAG.local;
  const w = FOX_TAG.halfWidth;
  const outline = new Shape(); // a pentagon, like an ema
  outline.moveTo(-w, -0.14).lineTo(w, -0.14).lineTo(w, 0.08).lineTo(0, 0.15).lineTo(-w, 0.08).closePath();
  const slab = new ExtrudeGeometry(outline, { depth: 0.035, bevelEnabled: false });
  slab.translate(0, 0, -0.0175);
  slab.rotateY(Math.PI / 2); // the shape's width runs along the fox's side and the slab faces forward
  const plaque = new Mesh(slab, wood);
  plaque.name = "fox-tag-plaque";
  plaque.position.set(px - hx, py - hy, 0);
  tag.add(plaque);
  [-1, 1].forEach((s) => {
    const from = new Vector3(0, 0, 0), to = new Vector3(px - hx, py - hy + 0.08, s * (w - 0.02));
    const len = from.distanceTo(to);
    const cord = new Mesh(new CylinderGeometry(0.007, 0.007, len, 6), cordMat);
    cord.name = s < 0 ? "fox-tag-cord-l" : "fox-tag-cord-r";
    cord.position.copy(from).add(to).multiplyScalar(0.5);
    cord.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), to.clone().sub(from).normalize());
    tag.add(cord);
  });
  root.add(tag);

  // place on the hill, facing the gate
  const [fx, , fz] = FOX.position;
  root.position.set(fx, hillHeight(fx, fz) - 0.02, fz);
  root.rotation.y = FOX.yaw;
  root.scale.set(...FOX_SCALE);

  const earBase = ears[1].rotation.z;
  return {
    object: root,
    update: (t) => {
      const gust = windGust(t);
      body.scale.y = 0.34 * (1 + 0.018 * Math.sin(t * 2.1)); // breathing
      head.rotation.z = Math.sin(t * 0.5) * 0.03;
      tail.rotation.y = Math.sin(t * 1.1) * 0.1 + gust * 0.12; // swishes, and the wind lifts it
      tag.rotation.x = Math.sin(t * 1.1) * 0.06; // the tag swings a little from side to side, and the wind pushes it back
      tag.rotation.z = gust * 0.1;
      const flick = Math.pow(Math.max(0, Math.sin(t * 1.05)), 40); // a quick ear twitch every six seconds or so
      ears[1].rotation.z = earBase + flick * 0.3;
      const blink = Math.pow(Math.max(0, Math.sin(t * 0.8 + 0.7)), 80);
      eyes.forEach((e) => (e.scale.y = 0.022 * (1 - 0.9 * blink)));
    },
  };
}
