import {
  BufferGeometry, CapsuleGeometry, CircleGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Group, IcosahedronGeometry,
  InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshToonMaterial, Quaternion, RingGeometry, Vector3, type Texture,
} from "three";
import { hillHeight } from "./hill";
import { riverFrame, riverWidthAt } from "./river";
import { mulberry32 } from "./rng";
import { windGust } from "./wind";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** A little life along the water: stones with foam, reed clumps with cattails, lily pads and petals drifting by. */
export const RIVERSIDE = { bankStones: 9, streamStones: 3, reedClumps: 6, bladesPerClump: 5, pads: 3, floatingPetals: 9, uMin: 0.45, uMax: 0.98 };

const WATER_LIFT = 0.07; // the river surface sits this far above the ground (see river.ts)

/** Ground point beside the river at river position u (0 far .. 1 near), `offset` units to the left of the flow (negative: right). */
export function riverPoint(u: number, offset: number): Vector3 {
  const { point, side } = riverFrame(u);
  const x = point.x + side.x * offset, z = point.z + side.z * offset;
  return new Vector3(x, hillHeight(x, z), z);
}

/** Unit ground normal at (x, z), from the hill's own height function. */
function groundNormal(x: number, z: number): Vector3 {
  const e = 0.2;
  return new Vector3(hillHeight(x - e, z) - hillHeight(x + e, z), 2 * e, hillHeight(x, z - e) - hillHeight(x, z + e)).normalize();
}

function reedBladeGeometry(): BufferGeometry {
  const pos: number[] = [], idx: number[] = [], N = 5;
  for (let i = 0; i < N; i++) {
    const t = i / N, w = 0.5 * (1 - t) ** 0.8, bend = 0.5 * t * t;
    pos.push(-w + bend, t, 0, w + bend, t, 0);
  }
  pos.push(0.5, 1, 0);
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  idx.push((N - 1) * 2, (N - 1) * 2 + 1, N * 2);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildRiverside(palette: Palette, toon?: Texture, seed = 17): ScenePart {
  const rng = mulberry32(seed);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const group = new Group();
  group.name = "riverside";
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), sc = new Vector3(), tmp = new Vector3();
  const U = () => r(RIVERSIDE.uMin, RIVERSIDE.uMax);
  const toonMat = (color: number, extra: object = {}) => new MeshToonMaterial({ color, gradientMap: toon ?? null, ...extra });

  // ---- stones: most on the banks, a few standing in the stream with a ring of foam around them
  const stoneColors = [0x4a4d57, 0x3b3e48];
  const stoneCount = RIVERSIDE.bankStones + RIVERSIDE.streamStones;
  const stones = new InstancedMesh(new IcosahedronGeometry(1, 1), toonMat(0xffffff), stoneCount);
  stones.name = "river-stones";
  stones.castShadow = true;
  stones.receiveShadow = true;
  const foamRing = new RingGeometry(0.95, 1.55, 28).rotateX(-Math.PI / 2);
  const foam: { mesh: Mesh; phase: number }[] = [];
  const foamMat = new MeshBasicMaterial({ color: 0xcfe3f5, transparent: true, opacity: 0.5, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, fog: false });
  for (let i = 0; i < stoneCount; i++) {
    const inStream = i >= RIVERSIDE.bankStones;
    const u = U();
    const half = riverWidthAt(u) / 2;
    const size = inStream ? r(0.1, 0.18) : r(0.12, 0.3);
    const offset = inStream ? r(-0.4, 0.4) * half : (rng() < 0.5 ? -1 : 1) * (half + r(0.05, 0.45));
    const p = riverPoint(u, offset);
    const lift = inStream ? WATER_LIFT : 0;
    e.set(r(-0.2, 0.2), r(0, Math.PI * 2), r(-0.2, 0.2));
    stones.setMatrixAt(i, m.compose(tmp.set(p.x, p.y + lift + size * 0.18, p.z), q.setFromEuler(e), sc.set(size * r(0.9, 1.3), size * r(0.55, 0.8), size * r(0.9, 1.3))));
    stones.setColorAt(i, new Color(stoneColors[i % 2]).offsetHSL(0, 0, r(-0.03, 0.03)));
    if (inStream) {
      const ring = new Mesh(foamRing, foamMat.clone());
      const n = groundNormal(p.x, p.z);
      ring.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), n);
      ring.position.set(p.x, p.y + lift + 0.05, p.z);
      ring.scale.setScalar(size * 1.15);
      ring.renderOrder = 1;
      group.add(ring);
      foam.push({ mesh: ring, phase: r(0, Math.PI * 2) });
    }
  }
  stones.instanceMatrix.needsUpdate = true;
  if (stones.instanceColor) stones.instanceColor.needsUpdate = true;
  group.add(stones);

  // ---- reeds with the odd cattail, clumped along the banks and swaying in the wind
  type Blade = { x: number; y: number; z: number; h: number; w: number; yaw: number; lean: number; phase: number; head: boolean };
  const blades: Blade[] = [];
  for (let c = 0; c < RIVERSIDE.reedClumps; c++) {
    const u = U(), half = riverWidthAt(u) / 2;
    const side = rng() < 0.5 ? -1 : 1;
    const base = riverPoint(u, side * (half + r(0.12, 0.5)));
    for (let k = 0; k < RIVERSIDE.bladesPerClump; k++) {
      blades.push({
        x: base.x + r(-0.18, 0.18), y: base.y - 0.02, z: base.z + r(-0.14, 0.14),
        h: r(0.7, 1.35), w: r(0.05, 0.075), yaw: r(-0.5, 0.5), lean: r(-0.14, 0.14), phase: r(0, Math.PI * 2), head: k < 2,
      });
    }
  }
  const reeds = new InstancedMesh(reedBladeGeometry(), toonMat(palette.grass[0], { side: DoubleSide }), blades.length);
  reeds.name = "reeds";
  reeds.frustumCulled = false;
  reeds.receiveShadow = true;
  const heads = blades.filter((b) => b.head);
  const cattails = new InstancedMesh(new CapsuleGeometry(0.04, 0.17, 3, 8), toonMat(palette.bark), heads.length);
  cattails.name = "cattails";
  cattails.frustumCulled = false;
  const placeReeds = (t: number) => {
    let hi = 0;
    blades.forEach((b, i) => {
      e.set(0, b.yaw, b.lean + Math.sin(t * 1.2 + b.phase) * 0.05 + windGust(t + b.x * 0.08) * 0.25, "YXZ");
      q.setFromEuler(e);
      reeds.setMatrixAt(i, m.compose(tmp.set(b.x, b.y, b.z), q, sc.set(b.w, b.h, b.w)));
      if (b.head) {
        const top = new Vector3(0.5 * 0.7 ** 2 * b.w, b.h * 0.8, 0).applyQuaternion(q).add(new Vector3(b.x, b.y, b.z)); // a point near the tip of the leaning blade
        cattails.setMatrixAt(hi++, m.compose(top, q, sc.set(1, 1, 1)));
      }
    });
    reeds.instanceMatrix.needsUpdate = true;
    cattails.instanceMatrix.needsUpdate = true;
  };
  placeReeds(0);
  group.add(reeds, cattails);

  // ---- lily pads, flat on the water
  const padGeo = new CircleGeometry(1, 22, 0.4, Math.PI * 2 - 0.8).rotateX(-Math.PI / 2);
  const padMat = new MeshBasicMaterial({ color: 0x3d6b45, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, fog: false });
  for (let i = 0; i < RIVERSIDE.pads; i++) {
    const u = r(0.62, 0.95), half = riverWidthAt(u) / 2;
    const p = riverPoint(u, r(-0.5, 0.5) * half);
    const pad = new Mesh(padGeo, padMat);
    pad.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), groundNormal(p.x, p.z)).multiply(q.setFromEuler(e.set(0, r(0, Math.PI * 2), 0)));
    pad.position.set(p.x, p.y + WATER_LIFT + 0.04, p.z);
    pad.scale.setScalar(r(0.13, 0.2));
    pad.name = "lily-pad";
    group.add(pad);
  }

  // ---- petals drifting downstream on the surface
  const petalGeo = new CircleGeometry(1, 10).scale(1, 0.55, 1).rotateX(-Math.PI / 2);
  const petalMat = new MeshBasicMaterial({ color: palette.petal, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, fog: false });
  const floaters = Array.from({ length: RIVERSIDE.floatingPetals }, () => ({
    mesh: new Mesh(petalGeo, petalMat),
    u0: r(0, 1), speed: r(0.012, 0.022), lateral: r(-0.32, 0.32), wobble: r(0, Math.PI * 2), spin: r(0, Math.PI * 2), size: r(0.05, 0.085),
  }));
  floaters.forEach((f) => { f.mesh.name = "floating-petal"; group.add(f.mesh); });
  const place = (t: number) => {
    for (const f of floaters) {
      const w = (f.u0 + t * f.speed) % 1; // progress along the visible stretch, 0 upstream .. 1 at the near end
      const u = RIVERSIDE.uMin + w * (RIVERSIDE.uMax - RIVERSIDE.uMin);
      const half = riverWidthAt(u) / 2;
      const p = riverPoint(u, (f.lateral + Math.sin(t * 0.6 + f.wobble) * 0.05) * half * 2);
      const n = groundNormal(p.x, p.z);
      f.mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), n).multiply(q.setFromEuler(e.set(0, f.spin + Math.sin(t * 0.5 + f.wobble) * 0.5, 0)));
      f.mesh.position.set(p.x, p.y + WATER_LIFT + 0.03, p.z);
      f.mesh.scale.setScalar(f.size * Math.min(1, w / 0.08, (1 - w) / 0.08)); // grows in and shrinks away, so none pop in or out
    }
  };
  place(0);

  return {
    object: group,
    update: (t) => {
      placeReeds(t);
      place(t);
      for (const f of foam) (f.mesh.material as MeshBasicMaterial).opacity = 0.35 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.6 + f.phase)); // foam breathes
    },
  };
}
