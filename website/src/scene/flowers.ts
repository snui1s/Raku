import {
  BufferGeometry, Color, CylinderGeometry, DoubleSide, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4,
  MeshToonMaterial, PerspectiveCamera, Quaternion, SphereGeometry, Vector3, type Texture,
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

export const FLOWERS = { susan: 70, poppy: 105 };
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

function combine(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return geometry;
}

function paint(geometry: BufferGeometry, rgb: [number, number, number]): BufferGeometry {
  const colors = new Float32Array(geometry.getAttribute("position").count * 3);
  for (let i = 0; i < colors.length; i += 3) colors.set(rgb, i);
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Rounded petals with a raised edge, a central crease and gentle ripples, facing local +z. */
function petalGeometry(angle: number, length: number, width: number, cup: number, lift: number, seed: number): BufferGeometry {
  const positions: number[] = [], colors: number[] = [], uv: number[] = [], indices: number[] = [];
  const broad = width > 0.3;
  const rows = broad ? 8 : 6, columns = 4; // enough to keep the cup and ripples; flowers are small on screen
  const ca = Math.cos(angle), sa = Math.sin(angle);
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const radius = 0.1 + (length - 0.1) * t;
    const spread = width * Math.sin(Math.PI * t) ** (broad ? 0.48 : 0.7);
    for (let column = 0; column <= columns; column++) {
      const side = column / columns * 2 - 1;
      const ripple = (broad ? 0.028 : 0.014) * Math.sin(t * 10 + seed) * side * side;
      const z = lift + cup * t * t + (broad ? 0.1 : 0.035) * side * side * Math.sin(Math.PI * t) + ripple;
      const tangent = side * spread + Math.sin(t * Math.PI) * Math.sin(seed) * 0.025;
      positions.push(ca * radius - sa * tangent, sa * radius + ca * tangent, z);
      const shade = (0.69 + 0.29 * Math.sin(t * Math.PI / 2)) * (1 - Math.abs(side) * 0.045);
      colors.push(shade, shade, shade);
      uv.push(column / columns, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A domed seed head with a subtle seed pattern in the vertex colours. */
function seedHead(radius: number, depth: number, rgb: [number, number, number]): BufferGeometry {
  const geometry = new SphereGeometry(radius, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  geometry.rotateX(Math.PI / 2);
  geometry.scale(1, 1, depth / radius);
  geometry.translate(0, 0, 0.055);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < colors.length / 3; i++) {
    // Colour by position so duplicated pole/seam vertices share a shade, avoiding triangular seams.
    const fleck = 0.9 + 0.06 * Math.sin(positions.getX(i) * 41) * Math.sin(positions.getY(i) * 37)
      + 0.12 * (positions.getZ(i) - 0.055) / depth;
    colors.set(rgb.map((channel) => channel * fleck), i * 3);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

function poppyHead(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    parts.push(petalGeometry(angle, 1.02 + Math.sin(i * 2) * 0.04, 0.61, 0.24, 0, i + 1));
    parts.push(petalGeometry(angle + 0.38, 0.79, 0.43, 0.19, 0.045, i + 5));
  }
  parts.push(seedHead(0.19, 0.11, [0.075, 0.055, 0.065]));
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * Math.PI * 2;
    const pollen = new SphereGeometry(0.025, 4, 2); // a few millimetres across: eight faces are plenty (indexed, like the rest, so it merges)
    pollen.translate(Math.cos(angle) * 0.245, Math.sin(angle) * 0.245, 0.1 + Math.sin(i * 2.1) * 0.015);
    parts.push(paint(pollen, [0.96, 0.74, 0.3]));
  }
  return combine(parts);
}

function susanHead(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 13; i++) {
    const angle = i / 13 * Math.PI * 2;
    parts.push(petalGeometry(angle, 0.95 + 0.06 * Math.sin(i * 2.4), 0.135, -0.12, 0.055, i));
  }
  parts.push(seedHead(0.305, 0.22, [0.24, 0.12, 0.045]));
  return combine(parts);
}

/** Pointed, gently folded leaves, attached at alternating heights on the stem. */
function leafGeometry(height: number, angle: number, length: number): BufferGeometry {
  const positions: number[] = [], colors: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 5, ca = Math.cos(angle), sa = Math.sin(angle);
  for (let row = 0; row <= rows; row++) {
    const t = row / rows, width = 0.047 * Math.sin(Math.PI * t) ** 0.8;
    for (let side = -1; side <= 1; side++) {
      const x = length * t, z = side * width;
      const ridge = (1 - Math.abs(side)) * 0.018 * Math.sin(Math.PI * t);
      positions.push(0.05 * Math.sin(Math.PI * height) + ca * x - sa * z,
        height + 0.09 * t + 0.045 * Math.sin(Math.PI * t) + ridge, sa * x + ca * z);
      const shade = side === 0 ? 1 : 0.77;
      colors.push(0.77 * shade, shade, 0.66 * shade);
      uv.push((side + 1) / 2, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < 2; column++) {
    const a = row * 3 + column, b = a + 3;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function stemGeometry(): BufferGeometry {
  const stem = new CylinderGeometry(0.007, 0.011, 1, 5, 4);
  stem.translate(0, 0.5, 0);
  const positions = stem.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) + 0.05 * Math.sin(Math.PI * positions.getY(i)));
  }
  stem.computeVertexNormals();
  return combine([paint(stem, [0.65, 0.8, 0.62]),
    leafGeometry(0.25, 0.1, 0.19), leafGeometry(0.49, Math.PI + 0.5, 0.17), leafGeometry(0.7, -0.6, 0.11)]);
}

export function buildFlowers(palette: Palette, toon?: Texture, seed = 3): ScenePart {
  const flowers = scatterFlowers(seed);
  const group = new Group();
  group.name = "flowers";
  const mat = (extra: object = {}) => new MeshToonMaterial({ color: 0xffffff, gradientMap: toon ?? null, side: DoubleSide, ...extra });

  const stems = new InstancedMesh(stemGeometry(), mat({ color: palette.grass[2], vertexColors: true }), flowers.length);
  stems.name = "flower-stems";
  const susanFlowers = flowers.filter((f) => f.kind === "susan");
  const poppyFlowers = flowers.filter((f) => f.kind === "poppy");
  const susans = new InstancedMesh(susanHead(), mat({ vertexColors: true }), susanFlowers.length);
  susans.name = "susan-heads";
  const poppies = new InstancedMesh(poppyHead(), mat({ vertexColors: true }), poppyFlowers.length);
  poppies.name = "poppy-heads";
  [stems, susans, poppies].forEach((m) => { m.frustumCulled = false; group.add(m); }); // they move every frame, and the camera is inside the field

  const col = new Color();
  susanFlowers.forEach((f, i) => susans.setColorAt(i, col.setHex(f.color)));
  poppyFlowers.forEach((f, i) => poppies.setColorAt(i, col.setHex(f.color)));

  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), hq = new Quaternion(), p = new Vector3(), s = new Vector3(), top = new Vector3();
  const facing = new Quaternion();
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
      facing.setFromEuler(e.set(-0.5 + Math.sin(f.phase) * 0.14, Math.cos(f.phase) * 0.16, 0));
      hq.copy(q).multiply(facing).multiply(spin.setFromAxisAngle(spinAxis, f.yaw)); // individual head tilt and spin
      const head = f.kind === "susan" ? susans : poppies;
      head.setMatrixAt(f.kind === "susan" ? si++ : pi++, m.compose(top, hq, s.set(f.size, f.size, f.size)));
    });
    [stems, susans, poppies].forEach((x) => (x.instanceMatrix.needsUpdate = true));
  };
  write(0);
  return { object: group, update: (t) => write(t) };
}
