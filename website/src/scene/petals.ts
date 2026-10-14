import {
  DoubleSide, Euler, InstancedMesh, Matrix4, MeshToonMaterial, Quaternion, Shape, ShapeGeometry, Vector3,
  type Texture,
} from "three";
import { hillHeight } from "./hill";
import { mulberry32 } from "./rng";
import { windGust } from "./wind";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Volume the petals live in (meters). They enter at the right edge and leave at the left. */
export const PETAL_BOUNDS = { xMin: -16, xMax: 14, yMin: -1, yMax: 13, zMin: -26, zMax: -4 };

export interface PetalState {
  count: number;
  pos: Float32Array; // x, y, z per petal
  vel: Float32Array; // vx, vy, vz per petal
  phase: Float32Array; // sway / spin phase
  rng: () => number;
}

const MAX_DT = 0.1; // a restored tab can report a huge dt; clamp it so petals do not teleport

function respawn(s: PetalState, i: number, anywhere: boolean) {
  const b = PETAL_BOUNDS, r = s.rng;
  s.pos[i * 3] = anywhere ? b.xMin + r() * (b.xMax - b.xMin) : b.xMax + r() * 3;
  s.pos[i * 3 + 2] = b.zMin + r() * (b.zMax - b.zMin);
  const lowest = Math.max(anywhere ? b.yMin + 1 : 3, hillHeight(s.pos[i * 3], s.pos[i * 3 + 2]) + 0.6); // never start inside the hill
  s.pos[i * 3 + 1] = lowest + r() * Math.max(1, b.yMax - lowest);
  s.vel[i * 3] = -(0.9 + r() * 0.9);
  s.vel[i * 3 + 1] = -(0.35 + r() * 0.45);
  s.vel[i * 3 + 2] = (r() - 0.5) * 0.2;
  s.phase[i] = r() * Math.PI * 2;
}

export function createPetals(count: number, seed = 3): PetalState {
  const s: PetalState = {
    count,
    pos: new Float32Array(count * 3),
    vel: new Float32Array(count * 3),
    phase: new Float32Array(count),
    rng: mulberry32(seed),
  };
  for (let i = 0; i < count; i++) respawn(s, i, true);
  return s;
}

export function stepPetals(s: PetalState, dt: number, gust = 0): void {
  const d = Math.min(Math.max(dt, 0), MAX_DT);
  for (let i = 0; i < s.count; i++) {
    s.phase[i] += d * (1.4 + (i % 5) * 0.25);
    const sway = Math.sin(s.phase[i]) * 0.5;
    s.pos[i * 3] += (s.vel[i * 3] * (1 + gust * 1.6) + sway * 0.4) * d; // gusts blow petals faster to the left
    s.pos[i * 3 + 1] += (s.vel[i * 3 + 1] * (1 - gust * 0.6) + Math.cos(s.phase[i] * 0.8) * 0.15 + gust * 0.5) * d;
    s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * d;
    const x = s.pos[i * 3], y = s.pos[i * 3 + 1], z = s.pos[i * 3 + 2];
    if (x < PETAL_BOUNDS.xMin || y < Math.max(PETAL_BOUNDS.yMin, hillHeight(x, z) + 0.05)) respawn(s, i, false);
  }
}

function petalGeometry(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.2, 0.5, 0.9, 0.55, 1, 0); s.bezierCurveTo(0.9, -0.5, 0.2, -0.45, 0, 0);
  return new ShapeGeometry(s);
}

export function buildPetals(palette: Palette, toon?: Texture, count = 65, seed = 3): ScenePart {
  const state = createPetals(count, seed);
  const mesh = new InstancedMesh(
    petalGeometry(),
    new MeshToonMaterial({ color: palette.petal, gradientMap: toon ?? null, side: DoubleSide }),
    count,
  );
  mesh.name = "petals";
  mesh.frustumCulled = false;
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), sc = new Vector3(0.28, 0.28, 0.28);
  const write = () => {
    for (let i = 0; i < count; i++) {
      p.set(state.pos[i * 3], state.pos[i * 3 + 1], state.pos[i * 3 + 2]);
      e.set(state.phase[i] * 1.3, state.phase[i] * 0.9, state.phase[i] * 1.7);
      mesh.setMatrixAt(i, m.compose(p, q.setFromEuler(e), sc));
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  write();
  return {
    object: mesh,
    update: (t, dt) => {
      stepPetals(state, dt, windGust(t));
      write();
    },
  };
}
