import {
  CubicBezierCurve3, CylinderGeometry, Euler, ExtrudeGeometry, Group, Matrix4, Mesh, MeshToonMaterial, Quaternion,
  Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type Texture,
} from "three";
import { hillHeight } from "./hill";
import { windGust } from "./wind";
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
  const p = foxLocalToWorld([1.9, 0.8, 0.2]), t = foxLocalToWorld([0.4, 0.72, 0]);
  return lookPose([p.x, p.y, p.z], [t.x, t.y, t.z], 38);
}

export function buildFox(palette: Palette, toon?: Texture): ScenePart {
  const mat = (c: number) => new MeshToonMaterial({ color: c, gradientMap: toon ?? null });
  const fur = mat(palette.fox[0]), cream = mat(palette.fox[1]), dark = mat(palette.fox[2]);
  const root = new Group();
  root.name = "fox";

  const ball = (m: MeshToonMaterial, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) => {
    // Higher tessellation keeps the fox soft-looking even in the close-up.
    const mesh = new Mesh(new SphereGeometry(1, 32, 24), m);
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
    const leg = new Mesh(new CylinderGeometry(0.05, 0.055, 0.34, 16), fur); // short, rounded-looking front leg
    leg.position.set(0.22, 0.27, s * 0.09);
    root.add(leg);
    const sock = new Mesh(new CylinderGeometry(0.052, 0.055, 0.12, 16), dark);
    sock.position.set(0.22, 0.1, s * 0.09);
    root.add(sock);
    ball(dark, 0.085, 0.045, 0.065, 0.25, 0.035, s * 0.09);
  });

  // head
  const head = new Group();
  head.name = "fox-head";
  head.position.set(0.3, 0.84, 0);
  root.add(head);
  ball(fur, 0.19, 0.17, 0.175, 0, 0, 0, head);
  [-1, 1].forEach((s) => ball(cream, 0.12, 0.085, 0.08, 0.035, -0.055, s * 0.095, head)); // puffy cheeks
  // A short rounded muzzle reads softer than the old sharp cone.
  ball(fur, 0.13, 0.075, 0.09, 0.16, -0.045, 0, head);
  ball(cream, 0.105, 0.05, 0.065, 0.205, -0.075, 0, head);
  ball(dark, 0.03, 0.026, 0.03, 0.315, -0.035, 0, head); // nose
  const shine = mat(0xffffff);
  const eyes = [-1, 1].map((s) => {
    const eye = new Group();
    eye.name = s < 0 ? "fox-eye-l" : "fox-eye-r";
    // Follow the enlarged head's surface normal so the eyes sit on the face, rather than inside it.
    eye.position.set(0.142, 0.044, s * 0.116);
    const normal = new Vector3(0.142 / 0.19 ** 2, 0.044 / 0.17 ** 2, s * 0.116 / 0.175 ** 2).normalize();
    eye.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
    ball(dark, 0.028, 0.036, 0.014, 0, 0, 0, eye);
    ball(shine, 0.009, 0.01, 0.004, -0.008, 0.012, 0.012, eye);
    ball(shine, 0.004, 0.004, 0.002, 0.009, -0.01, 0.014, eye);
    head.add(eye);
    return eye;
  });
  const ears = [-1, 1].map((s) => {
    const ear = new Group();
    ear.name = s < 0 ? "fox-ear-l" : "fox-ear-r";
    ear.position.set(-0.035, 0.13, s * 0.1);
    ear.rotation.x = -s * 0.3; // leaned outward
    // Pointed fox ears, with a gently bevelled edge and a smaller cream triangle on the front.
    const earShape = new Shape();
    earShape.moveTo(-0.085, -0.025).quadraticCurveTo(-0.075, 0.08, 0, 0.25)
      .quadraticCurveTo(0.075, 0.08, 0.085, -0.025).closePath();
    const outerGeometry = new ExtrudeGeometry(earShape, {
      depth: 0.055, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 3, curveSegments: 16,
    });
    outerGeometry.translate(0, 0, -0.0275);
    outerGeometry.rotateY(Math.PI / 2);
    const outer = new Mesh(outerGeometry, fur);
    const innerShape = new Shape();
    innerShape.moveTo(-0.045, 0.015).lineTo(0, 0.185).lineTo(0.045, 0.015).closePath();
    const innerGeometry = new ExtrudeGeometry(innerShape, { depth: 0.004, bevelEnabled: false });
    innerGeometry.rotateY(Math.PI / 2);
    const inner = new Mesh(innerGeometry, cream);
    inner.position.x = 0.039;
    ear.add(outer, inner);
    head.add(ear);
    return ear;
  });

  // One continuous tail surface: full in the middle, tapering to a closed cream tip.
  const tail = new Group();
  tail.name = "fox-tail";
  tail.position.set(-0.3, 0.23, 0.03);
  const curve = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(-0.38, -0.04, 0.2), new Vector3(-0.3, -0.06, 0.52), new Vector3(0.52, -0.08, 0.38));
  const segments = 48, radial = 20;
  const tailGeometry = new TubeGeometry(curve, segments, 1, radial, false);
  const positions = tailGeometry.getAttribute("position");
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, centre = curve.getPointAt(t);
    const radius = i === segments ? 0 : 0.055 * (1 - t) + 0.14 * Math.sin(Math.PI * t) ** 0.85;
    for (let j = 0; j <= radial; j++) {
      const index = i * (radial + 1) + j;
      const vertex = new Vector3().fromBufferAttribute(positions, index).sub(centre).multiplyScalar(radius).add(centre);
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }
  tailGeometry.computeVertexNormals();
  tailGeometry.clearGroups();
  const creamStart = Math.floor(segments * 0.72) * radial * 6;
  tailGeometry.addGroup(0, creamStart, 0);
  tailGeometry.addGroup(creamStart, segments * radial * 6 - creamStart, 1);
  const tailMesh = new Mesh(tailGeometry, [fur, cream]);
  tailMesh.name = "fox-tail-fur";
  tail.add(tailMesh);
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
      eyes.forEach((e) => (e.scale.y = 1 - 0.9 * blink));
    },
  };
}
