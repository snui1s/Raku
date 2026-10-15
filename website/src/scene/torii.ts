import {
  BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshToonMaterial, Shape,
  type Texture,
} from "three";
import { hillHeight } from "./hill";
import type { Palette } from "./palette";

/** Dimensions in meters, from the SVG prototype (mockups/landing-hero.html). */
export const TORII = {
  halfSpan: 2.15, // half the distance between pillar centers
  height: 4.5, // pillar height above the gate's reference level
  yawDeg: 34, // the right side is turned toward the camera
  position: [1.6, 0, -17] as [number, number, number], // x, (y comes from the hill), z
};

const KASAGI_HALF = TORII.halfSpan + 1.1;
const lift = (x: number) => 0.5 * Math.pow(Math.abs(x) / KASAGI_HALF, 2.4); // ends curve up

/** Curved beam silhouette (front view) extruded back along z. */
function curvedBeam(yBottom: number, yTop: number, depth: number): ExtrudeGeometry {
  const N = 26, s = new Shape();
  for (let i = 0; i <= N; i++) {
    const x = -KASAGI_HALF + (2 * KASAGI_HALF * i) / N;
    const y = yBottom + lift(x);
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const x = -KASAGI_HALF + (2 * KASAGI_HALF * i) / N;
    s.lineTo(x, yTop + lift(x));
  }
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function buildTorii(palette: Palette, toon?: Texture): Group {
  const mat = (color: number) => new MeshToonMaterial({ color, gradientMap: toon ?? null });
  const red = mat(palette.accent), ink = mat(palette.ink);
  const gate = new Group();
  gate.name = "torii";

  const yaw = (TORII.yawDeg * Math.PI) / 180;
  const [cx, , cz] = TORII.position;
  const A = TORII.halfSpan;
  // ground under each pillar (the gate is yawed, so the two pillars stand at different depths)
  const groundAt = (side: -1 | 1) => hillHeight(cx + side * A * Math.cos(yaw), cz + side * A * Math.sin(yaw));
  const gL = groundAt(-1), gR = groundAt(1);
  const base = Math.max(gL, gR);
  gate.position.set(cx, base, cz);
  gate.rotation.y = -yaw;

  const part = (name: string, geo: BoxGeometry | ExtrudeGeometry, material: MeshToonMaterial, x: number, y: number) => {
    const m = new Mesh(geo, material);
    m.name = name;
    m.position.set(x, y, 0);
    gate.add(m);
    return m;
  };
  const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);

  // pillars: slightly tapered, leaning inward, extended down to meet the ground and sunk a little
  ([-1, 1] as const).forEach((side) => {
    const ground = side === -1 ? gL : gR;
    const bottom = ground - base - 0.3;
    const top = TORII.height - 0.3; // ends inside the shimaki, so no cap shows above it
    const len = top - bottom;
    const geo = new CylinderGeometry(0.21, 0.3, len, 20);
    const p = new Mesh(geo, red);
    p.name = side === -1 ? "pillar-left" : "pillar-right";
    p.position.set(side * A, bottom + len / 2, 0);
    p.rotation.z = -side * Math.atan(0.12 / TORII.height); // top leans toward the middle
    gate.add(p);

    const foot = new Mesh(new CylinderGeometry(0.36, 0.4, 0.5, 20), ink);
    foot.name = side === -1 ? "foot-left" : "foot-right";
    foot.position.set(side * A, ground - base + 0.0, 0);
    gate.add(foot);
  });

  part("nuki", box(2 * (A + 0.4), 0.27, 0.24), red, 0, 3.28);
  part("gakuzuka", box(0.34, 0.68, 0.18), red, 0, 3.76);
  part("shimaki", box(2 * (A + 0.55), 0.26, 0.4), red, 0, 4.23);
  part("kasagi", curvedBeam(4.36, 4.68, 1.0), red, 0, 0);
  part("kasagi-top", curvedBeam(4.68, 4.84, 1.0), ink, 0, 0);

  return gate;
}
