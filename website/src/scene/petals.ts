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
  /** All petals, the always-falling ones first and then the spare ones that only appear in a burst. */
  count: number;
  /** How many of them are always falling (they respawn at the right edge). The rest are spares. */
  regular: number;
  pos: Float32Array; // x, y, z per petal
  vel: Float32Array; // vx, vy, vz per petal
  kick: Float32Array; // extra velocity from a burst, which fades away
  phase: Float32Array; // sway / spin phase
  active: Uint8Array; // 1 if the petal is in the air (spares start at 0)
  rng: () => number;
  next: number; // which spare a burst uses next
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

export function createPetals(count: number, seed = 3, spares = 0): PetalState {
  const total = count + spares;
  const s: PetalState = {
    count: total,
    regular: count,
    pos: new Float32Array(total * 3),
    vel: new Float32Array(total * 3),
    kick: new Float32Array(total * 3),
    phase: new Float32Array(total),
    active: new Uint8Array(total),
    rng: mulberry32(seed),
    next: count,
  };
  for (let i = 0; i < count; i++) { respawn(s, i, true); s.active[i] = 1; }
  return s;
}

/** Shakes `amount` petals loose around `origin` (a point in the blossom): they fly outward and up, then drift and fall
 *  like the others. Only resting spares are used, so another click never teleports petals already in the air. */
export function burstPetals(s: PetalState, origin: [number, number, number], amount: number, radius = 2.4): void {
  const r = s.rng, spares = s.count - s.regular;
  if (spares <= 0) return;
  let emitted = 0;
  for (let n = 0; n < spares && emitted < amount; n++) {
    const i = s.next;
    s.next = s.next + 1 >= s.count ? s.regular : s.next + 1;
    if (s.active[i]) continue;
    emitted++;
    const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1), d = radius * Math.cbrt(r());
    const dx = Math.sin(b) * Math.cos(a), dy = Math.cos(b), dz = Math.sin(b) * Math.sin(a);
    s.pos[i * 3] = origin[0] + dx * d;
    s.pos[i * 3 + 1] = origin[1] + dy * d;
    s.pos[i * 3 + 2] = origin[2] + dz * d;
    s.vel[i * 3] = -(0.9 + r() * 0.9);
    s.vel[i * 3 + 1] = -(0.35 + r() * 0.45);
    s.vel[i * 3 + 2] = (r() - 0.5) * 0.2;
    const speed = 1.8 + r() * 2.4; // the push away from the middle of the burst
    s.kick[i * 3] = dx * speed;
    s.kick[i * 3 + 1] = dy * speed * 0.7 + 1.2;
    s.kick[i * 3 + 2] = dz * speed;
    s.phase[i] = r() * Math.PI * 2;
    s.active[i] = 1;
  }
}

export function stepPetals(s: PetalState, dt: number, gust = 0): void {
  const d = Math.min(Math.max(dt, 0), MAX_DT);
  const fade = Math.exp(-1.4 * d); // the push from a burst fades
  for (let i = 0; i < s.count; i++) {
    if (!s.active[i]) continue;
    s.phase[i] += d * (1.4 + (i % 5) * 0.25);
    const sway = Math.sin(s.phase[i]) * 0.5;
    s.pos[i * 3] += (s.vel[i * 3] * (1 + gust * 1.6) + sway * 0.4) * d; // gusts blow petals faster to the left
    s.pos[i * 3 + 1] += (s.vel[i * 3 + 1] * (1 - gust * 0.6) + Math.cos(s.phase[i] * 0.8) * 0.15 + gust * 0.5) * d;
    s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * d;
    for (let k = 0; k < 3; k++) { s.pos[i * 3 + k] += s.kick[i * 3 + k] * d; s.kick[i * 3 + k] *= fade; }
    const x = s.pos[i * 3], y = s.pos[i * 3 + 1], z = s.pos[i * 3 + 2];
    if (x < PETAL_BOUNDS.xMin || y < Math.max(PETAL_BOUNDS.yMin, hillHeight(x, z) + 0.05)) {
      if (i < s.regular) respawn(s, i, false);
      else s.active[i] = 0; // a spare that has fallen or blown away rests until the next burst
    }
  }
}

function petalGeometry(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.2, 0.5, 0.9, 0.55, 1, 0); s.bezierCurveTo(0.9, -0.5, 0.2, -0.45, 0, 0);
  return new ShapeGeometry(s);
}

export function buildPetals(palette: Palette, toon?: Texture, count = 65, seed = 3, spares = 60): ScenePart & { burst(origin: Vector3, amount?: number): void } {
  const state = createPetals(count, seed, spares);
  const total = state.count;
  const mesh = new InstancedMesh(
    petalGeometry(),
    new MeshToonMaterial({ color: palette.petal, gradientMap: toon ?? null, side: DoubleSide }),
    total,
  );
  mesh.name = "petals";
  mesh.frustumCulled = false;
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), sc = new Vector3(0.28, 0.28, 0.28), big = new Vector3(0.38, 0.38, 0.38), none = new Vector3(0, 0, 0);
  const write = () => {
    for (let i = 0; i < total; i++) {
      p.set(state.pos[i * 3], state.pos[i * 3 + 1], state.pos[i * 3 + 2]);
      e.set(state.phase[i] * 1.3, state.phase[i] * 0.9, state.phase[i] * 1.7);
      mesh.setMatrixAt(i, m.compose(p, q.setFromEuler(e), state.active[i] ? (i < state.regular ? sc : big) : none)); // a resting spare has no size; the ones from a burst are a bit larger so the shower reads
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
    burst: (origin, amount = 20) => burstPetals(state, [origin.x, origin.y, origin.z], amount),
  };
}
