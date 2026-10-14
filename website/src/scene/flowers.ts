import {
  BufferGeometry, Color, CylinderGeometry, DoubleSide, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4,
  MeshToonMaterial, PerspectiveCamera, Quaternion, Shape, ShapeGeometry, Vector3, type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CAMERA } from "./camera";
import { FOX } from "./fox";
import { hillHeight } from "./hill";
import { riverDistance, riverWidthAt } from "./river";
import { mulberry32 } from "./rng";
import { TORII } from "./torii";
import { TREE } from "./tree";
import { windGust } from "./wind";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

export const FLOWERS = { susan: 90, poppy: 140 };
export const POPPY_COLORS = [0xe53935, 0xff7a2f, 0xff8fb3, 0xfff1ea, 0xffd23f, 0xd63a8c];
const SUSAN_COLORS = [0xffc61a, 0xf7a600, 0xffd84d];

export interface Flower {
  kind: "susan" | "poppy";
  x: number; y: number; z: number;
  height: number; // stem length
  size: number; // head radius
  yaw: number; lean: number; phase: number;
  color: number;
}

const camera = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
camera.position.set(...CAMERA.position);
camera.lookAt(new Vector3(...CAMERA.target));
camera.updateMatrixWorld(true);
camera.updateProjectionMatrix();

/** The ground point seen through a screen position (NDC), or null if the ray never meets the hill. */
function groundAt(nx: number, ny: number): Vector3 | null {
  const dir = new Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
  const p = new Vector3();
  for (let d = 2; d < 70; d += 0.05) {
    p.copy(camera.position).addScaledVector(dir, d);
    if (p.y <= hillHeight(p.x, p.z)) return p.setY(hillHeight(p.x, p.z));
  }
  return null;
}

/** Scatter flowers over the part of the hill the camera sees, avoiding the river, the fox, the gate feet and the tree. */
export function scatterFlowers(seed = 3): Flower[] {
  const rng = mulberry32(seed);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const th = (TORII.yawDeg * Math.PI) / 180, A = TORII.halfSpan;
  const keepOut: [number, number, number][] = [
    [FOX.position[0], FOX.position[2], 1.0],
    [TREE.position[0], TREE.position[2], 2.0],
    [TORII.position[0] - A * Math.cos(th), TORII.position[2] - A * Math.sin(th), 0.7],
    [TORII.position[0] + A * Math.cos(th), TORII.position[2] + A * Math.sin(th), 0.7],
  ];
  const out: Flower[] = [];
  const make = (kind: Flower["kind"], count: number, colors: number[]) => {
    let made = 0, tries = 0;
    while (made < count && tries++ < count * 60) {
      const g = groundAt(r(-1.18, 1.18), r(-0.98, -0.14));
      if (!g) continue;
      if (riverDistance(g.x, g.z) < riverWidthAt(1) / 2 + 0.15) continue;
      if (keepOut.some(([x, z, rad]) => Math.hypot(g.x - x, g.z - z) < rad)) continue;
      const dist = Math.hypot(g.x, g.z);
      const scale = Math.pow(dist / 9, 0.6); // farther flowers are drawn bigger so they still read
      out.push({
        kind, x: g.x, y: g.y, z: g.z,
        size: Math.min(0.24, Math.max(0.085, 0.1 * scale)) * (kind === "poppy" ? 1.1 : 0.95),
        height: Math.min(0.75, Math.max(0.25, r(0.3, 0.6) * Math.pow(dist / 9, 0.3))),
        yaw: r(0, Math.PI * 2), lean: r(-0.14, 0.14), phase: r(0, Math.PI * 2),
        color: colors[Math.floor(rng() * colors.length)],
      });
      made++;
    }
  };
  make("susan", FLOWERS.susan, SUSAN_COLORS);
  make("poppy", FLOWERS.poppy, POPPY_COLORS);
  return out;
}

/** Flat flower shapes in the XY plane (radius about 1), colored with vertex colors: petals white, center dark. */
function headGeometry(petals: Shape[], center: Shape, centerColor: [number, number, number]): BufferGeometry {
  const parts = petals.map((s) => paint(new ShapeGeometry(s), [1, 1, 1], 0));
  parts.push(paint(new ShapeGeometry(center), centerColor, 0.02)); // the center sits just above the petals
  return mergeGeometries(parts)!;
}
function paint(g: ShapeGeometry, rgb: [number, number, number], lift: number): ShapeGeometry {
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.set(rgb, i * 3);
  g.setAttribute("color", new Float32BufferAttribute(c, 3));
  g.translate(0, 0, lift);
  return g;
}
const circle = (cx: number, cy: number, r: number) => new Shape().absarc(cx, cy, r, 0, Math.PI * 2, false);

function poppyHead(): BufferGeometry {
  const petals = [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return circle(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.58);
  });
  return headGeometry(petals, circle(0, 0, 0.2), [0.08, 0.06, 0.08]);
}
function susanHead(): BufferGeometry {
  const petals = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return new Shape().absellipse(Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.36, 0.13, 0, Math.PI * 2, false, a);
  });
  return headGeometry(petals, circle(0, 0, 0.36), [0.3, 0.12, 0.04]);
}

export function buildFlowers(palette: Palette, toon?: Texture, seed = 3): ScenePart {
  const flowers = scatterFlowers(seed);
  const group = new Group();
  group.name = "flowers";
  const mat = (extra: object = {}) => new MeshToonMaterial({ color: 0xffffff, gradientMap: toon ?? null, side: DoubleSide, ...extra });

  const stemGeo = new CylinderGeometry(0.014, 0.02, 1, 5);
  stemGeo.translate(0, 0.5, 0);
  const stems = new InstancedMesh(stemGeo, mat({ color: palette.grass[1] }), flowers.length);
  stems.name = "flower-stems";
  const susanFlowers = flowers.filter((f) => f.kind === "susan");
  const poppyFlowers = flowers.filter((f) => f.kind === "poppy");
  const susans = new InstancedMesh(susanHead(), mat({ vertexColors: true }), susanFlowers.length);
  susans.name = "susan-heads";
  const poppies = new InstancedMesh(poppyHead(), mat({ vertexColors: true }), poppyFlowers.length);
  poppies.name = "poppy-heads";
  [stems, susans, poppies].forEach((m) => { m.frustumCulled = false; group.add(m); });

  const col = new Color();
  susanFlowers.forEach((f, i) => susans.setColorAt(i, col.setHex(f.color)));
  poppyFlowers.forEach((f, i) => poppies.setColorAt(i, col.setHex(f.color)));

  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), hq = new Quaternion(), p = new Vector3(), s = new Vector3(), top = new Vector3();
  const facing = new Quaternion().setFromEuler(new Euler(-0.5, 0, 0)); // heads face the camera, tipped up a little
  const spin = new Quaternion(), spinAxis = new Vector3(0, 0, 1);
  const write = (t: number) => {
    let si = 0, pi = 0;
    flowers.forEach((f, i) => {
      const sway = Math.sin(t * 1.3 + f.phase) * 0.05 + windGust(t + f.x * 0.08) * 0.3; // leans left in gusts
      q.setFromEuler(e.set(0, 0, f.lean + sway)); // stems only lean; the petals are spun separately
      const w = f.size * 8;
      stems.setMatrixAt(i, m.compose(p.set(f.x, f.y, f.z), q, s.set(w, f.height, w)));
      top.set(0, f.height, 0).applyQuaternion(q);
      top.x += f.x; top.y += f.y; top.z += f.z;
      hq.copy(q).multiply(facing).multiply(spin.setFromAxisAngle(spinAxis, f.yaw)); // random spin about the flower face
      const head = f.kind === "susan" ? susans : poppies;
      head.setMatrixAt(f.kind === "susan" ? si++ : pi++, m.compose(top, hq, s.set(f.size, f.size, f.size)));
    });
    [stems, susans, poppies].forEach((x) => (x.instanceMatrix.needsUpdate = true));
  };
  write(0);
  return { object: group, update: (t) => write(t) };
}
