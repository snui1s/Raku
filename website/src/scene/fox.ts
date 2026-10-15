import {
  type BufferGeometry, ConeGeometry, CubicBezierCurve3, CylinderGeometry, Euler, ExtrudeGeometry, Group, IcosahedronGeometry, Matrix4,
  Mesh, MeshToonMaterial, OctahedronGeometry, Quaternion, Shape, SphereGeometry, TorusGeometry, Vector3, type Texture,
} from "three";
import { hillHeight } from "./hill";
import { windGust } from "./wind";
import { createReaction } from "./reaction";
import { faceted, facetedTube } from "./lowpoly";
import { mulberry32 } from "./rng";
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

const FACET = 0.24; // how different neighbouring facets are in shade: enough that the cut shows from across the hill
const BODY_Y = 0.36; // the body's height scale, which breathing varies a little
const HEAD_AT = new Vector3(0.3, 0.84, 0); // where the head sits on the fox (fox-local)
const MAX_YAW = 0.6, MAX_PITCH = 0.35;

/** How far the head turns (yaw, sideways) and tips (pitch) to look at a point, given as an offset from the head in
 *  fox-local coordinates (x forward, y up). Both are limited, so it never twists round. */
export function lookAngles(offset: Vector3): { yaw: number; pitch: number } {
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  return {
    yaw: clamp(Math.atan2(-offset.z, offset.x), MAX_YAW),
    pitch: clamp(Math.atan2(offset.y, Math.hypot(offset.x, offset.z)), MAX_PITCH),
  };
}

/** The close-up for the download: in front of the fox, low, with the face above the tag. */
export function foxCamera(): Pose {
  const p = foxLocalToWorld([1.9, 0.8, 0.2]), t = foxLocalToWorld([0.4, 0.72, 0]);
  return lookPose([p.x, p.y, p.z], [t.x, t.y, t.z], 38);
}

export function buildFox(palette: Palette, toon?: Texture): ScenePart & { react(): void; look(target: Vector3 | null): void } {
  const mat = (c: number) => new MeshToonMaterial({ color: c, gradientMap: toon ?? null });
  const fur = mat(palette.fox[0]), cream = mat(palette.fox[1]), dark = mat(palette.fox[2]);
  const root = new Group();
  root.name = "fox";

  const ball = (m: MeshToonMaterial, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) => {
    const mesh = new Mesh(new SphereGeometry(1, 14, 10), m); // only the eyes use this, and they are small
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };

  // Low poly: a few big shapes with flat facets, each facet a slightly different shade, like cut paper.
  const rng = mulberry32(11);
  const facets = new MeshToonMaterial({ vertexColors: true, gradientMap: toon ?? null });
  const [FUR, CREAM, DARK] = palette.fox, PINK = 0xefbfae;
  const gem = (geo: BufferGeometry, color: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) => {
    const mesh = new Mesh(faceted(geo, color, rng, FACET), facets);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    parent.add(mesh);
    return mesh;
  };
  const rock = (color: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, parent: Group = root, name?: string) =>
    gem(new IcosahedronGeometry(1, 1), color, sx, sy, sz, x, y, z, parent, name);

  // body: plump, tilted so the chest is high and the rump is low, as when sitting up
  const body = rock(FUR, 0.38, BODY_Y, 0.29, -0.02, 0.4, 0, root, "fox-body");
  body.rotation.z = 0.5;
  rock(CREAM, 0.21, 0.28, 0.21, 0.2, 0.47, 0); // chest
  [-1, 1].forEach((s) => {
    rock(FUR, 0.23, 0.23, 0.14, -0.14, 0.23, s * 0.18); // haunch
    rock(CREAM, 0.15, 0.055, 0.08, 0.0, 0.05, s * 0.18); // hind paw
    gem(new CylinderGeometry(0.052, 0.062, 0.36, 5), DARK, 1, 1, 1, 0.22, 0.24, s * 0.09); // dark front leg
    rock(DARK, 0.09, 0.045, 0.07, 0.25, 0.035, s * 0.09); // front paw
  });

  // head: a wide skull, puffy cream cheeks, a pointed muzzle and tall pointed ears
  const head = new Group();
  head.name = "fox-head";
  head.position.set(0.3, 0.84, 0);
  root.add(head);
  rock(FUR, 0.19, 0.17, 0.175, 0, 0, 0, head);
  [-1, 1].forEach((s) => rock(CREAM, 0.12, 0.085, 0.085, 0.04, -0.055, s * 0.1, head)); // cheeks
  const muzzle = new ConeGeometry(0.1, 0.3, 5);
  muzzle.rotateZ(-Math.PI / 2); // the point faces forward
  gem(muzzle, FUR, 1, 0.85, 0.95, 0.185, -0.04, 0, head);
  rock(CREAM, 0.125, 0.05, 0.08, 0.2, -0.085, 0, head); // under the muzzle
  gem(new OctahedronGeometry(1, 0), DARK, 0.032, 0.027, 0.03, 0.335, -0.036, 0, head); // nose
  const shine = mat(0xffffff);
  const eyes = [-1, 1].map((s) => {
    const eye = new Group();
    eye.name = s < 0 ? "fox-eye-l" : "fox-eye-r";
    // Sit on the face: the facets lie a little inside the smooth shape these numbers describe, so pull the eyes in a touch.
    eye.position.set(0.142 * 0.975, 0.044 * 0.975, s * 0.116 * 0.975);
    const normal = new Vector3(0.142 / 0.19 ** 2, 0.044 / 0.17 ** 2, s * 0.116 / 0.175 ** 2).normalize();
    eye.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
    const almond = ball(dark, 0.034, 0.022, 0.014, 0, 0, 0, eye); // a narrow, slanted eye, not a round one
    almond.rotation.z = s * 0.32;
    ball(shine, 0.009, 0.01, 0.004, -0.008, 0.012, 0.012, eye);
    ball(shine, 0.004, 0.004, 0.002, 0.009, -0.01, 0.014, eye);
    head.add(eye);
    return eye;
  });
  const cone = (radius: number, height: number) => new ConeGeometry(radius, height, 4).translate(0, height / 2, 0); // a four-sided point, standing on its base
  const ears = [-1, 1].map((s) => {
    const ear = new Group();
    ear.name = s < 0 ? "fox-ear-l" : "fox-ear-r";
    ear.position.set(-0.03, 0.085, s * 0.085); // the base is inside the skull, so each ear grows out of the head
    ear.rotation.x = s * 0.2; // lean each tip away from the centre of the head
    gem(cone(0.095, 0.34), FUR, 0.6, 1, 1, 0, 0, 0, ear); // flat from front to back, wide across
    gem(cone(0.048, 0.14), DARK, 0.6, 1, 1, 0, 0.204, 0, ear); // dark tip
    gem(cone(0.058, 0.24), PINK, 0.3, 1, 1, 0.043, 0.07, 0, ear); // pink inside, on the front
    head.add(ear);
    return ear;
  });

  // The tail: big and bushy, curling round the feet, with a cream tip. Seven flat sides, so it is faceted too.
  const tail = new Group();
  tail.name = "fox-tail";
  tail.position.set(-0.3, 0.23, 0.03);
  const curve = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(-0.38, -0.04, 0.2), new Vector3(-0.3, -0.06, 0.52), new Vector3(0.52, -0.08, 0.38));
  const tailMesh = new Mesh(
    facetedTube(curve, (t) => 0.055 * (1 - t) + 0.14 * Math.sin(Math.PI * t) ** 0.85, (t) => (t > 0.66 ? CREAM : FUR), 14, 6, rng, FACET),
    facets,
  );
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

  const earBase = ears.map((e) => e.rotation.z);
  const nod = createReaction(10, 1.7), wag = createReaction(24, 1.7), earWiggle = createReaction(32, 1.7);
  let target: Vector3 | null = null; // a point in the world the fox is looking at, or null for straight ahead
  let yaw = 0, pitch = 0;
  return {
    object: root,
    react: () => { nod.kick(); wag.kick(); earWiggle.kick(); },
    look: (p) => { target = p ? p.clone() : null; },
    update: (t, dt) => {
      const gust = windGust(t);
      const nodding = nod.step(dt), wagging = wag.step(dt), wiggling = earWiggle.step(dt);

      // the head turns toward the pointer, a little, and eases back when there is nothing to look at
      let yawGoal = 0, pitchGoal = 0;
      if (target) {
        root.updateWorldMatrix(true, false);
        const a = lookAngles(root.worldToLocal(target.clone()).sub(HEAD_AT));
        yawGoal = a.yaw;
        pitchGoal = a.pitch;
      }
      const ease = 1 - Math.exp(-Math.max(0, dt ?? 0) * 5);
      yaw += (yawGoal - yaw) * ease;
      pitch += (pitchGoal - pitch) * ease;
      head.rotation.y = yaw;

      body.scale.y = BODY_Y * (1 + 0.018 * Math.sin(t * 2.1)); // breathing
      head.rotation.z = Math.sin(t * 0.5) * 0.03 + pitch + nodding * 0.1;
      tail.rotation.y = Math.sin(t * 1.1) * 0.1 + gust * 0.12 + wagging * 0.55;
      tag.rotation.x = Math.sin(t * 1.1) * 0.06; // the tag swings a little from side to side, and the wind pushes it back
      tag.rotation.z = gust * 0.1;
      const flick = Math.pow(Math.max(0, Math.sin(t * 1.05)), 40); // a quick ear twitch every six seconds or so
      const wiggle = wiggling * 0.4; // both ears waggle, in opposite directions
      ears[0].rotation.z = earBase[0] - wiggle;
      ears[1].rotation.z = earBase[1] + flick * 0.3 + wiggle;
      const blink = Math.pow(Math.max(0, Math.sin(t * 0.8 + 0.7)), 80);
      eyes.forEach((e) => (e.scale.y = 1 - 0.9 * blink));
    },
  };
}
