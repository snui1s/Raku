import {
  BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Group, InstancedMesh, Matrix4,
  MeshToonMaterial, Quaternion, Vector3, type Texture,
} from "three";
import { hillHeight } from "./hill";
import { mulberry32 } from "./rng";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** One blade: 1 unit tall, slightly bent, tapering to a point. */
function bladeGeometry(): BufferGeometry {
  const pos: number[] = [], idx: number[] = [], N = 4;
  for (let i = 0; i < N; i++) {
    const t = i / N, w = 0.5 * (1 - t) ** 0.9, bend = 0.3 * t * t;
    pos.push(-w + bend, t, 0, w + bend, t, 0);
  }
  pos.push(0.3, 1, 0); // tip
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  idx.push((N - 1) * 2, (N - 1) * 2 + 1, N * 2);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

interface Layer { name: string; count: number; z: [number, number]; h: [number, number]; w: number; color: number }

export function buildGrass(palette: Palette, toon?: Texture, seed = 11): ScenePart & { count: number } {
  const rng = mulberry32(seed);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const geo = bladeGeometry();
  const group = new Group();
  group.name = "grass";
  const layers: Layer[] = [
    { name: "grass-back", count: 130, z: [-9.5, -6.5], h: [0.3, 0.65], w: 0.09, color: palette.grass[0] },
    { name: "grass-mid", count: 110, z: [-7, -4.5], h: [0.4, 0.85], w: 0.1, color: palette.grass[1] },
    { name: "grass-front", count: 80, z: [-5, -2.8], h: [0.5, 1.15], w: 0.12, color: palette.grass[2] },
  ];

  type Blade = { x: number; y: number; z: number; h: number; w: number; yaw: number; lean: number; phase: number };
  const all: { mesh: InstancedMesh; blades: Blade[] }[] = [];
  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3();
  const compose = (mesh: InstancedMesh, i: number, b: Blade, sway: number) => {
    e.set(0, b.yaw, b.lean + sway, "YXZ");
    mesh.setMatrixAt(i, m.compose(p.set(b.x, b.y, b.z), q.setFromEuler(e), s.set(b.w, b.h, b.w)));
  };

  for (const l of layers) {
    const mesh = new InstancedMesh(geo, new MeshToonMaterial({ color: new Color(l.color), gradientMap: toon ?? null, side: DoubleSide }), l.count);
    mesh.name = l.name;
    mesh.frustumCulled = false;
    const blades: Blade[] = [];
    for (let i = 0; i < l.count; i++) {
      const z = r(l.z[0], l.z[1]);
      const reach = Math.abs(z) * 0.75 + 1.2; // wider ground is visible farther away
      const x = r(-0.9 - reach, -0.9 + reach);
      const b: Blade = { x, y: hillHeight(x, z) - 0.02, z, h: r(l.h[0], l.h[1]), w: l.w * r(0.8, 1.3), yaw: r(-0.6, 0.6), lean: r(-0.28, 0.28), phase: r(0, Math.PI * 2) };
      blades.push(b);
      compose(mesh, i, b, 0);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    all.push({ mesh, blades });
  }

  return {
    object: group,
    count: layers.reduce((n, l) => n + l.count, 0),
    update: (t) => {
      for (const { mesh, blades } of all) {
        blades.forEach((b, i) => compose(mesh, i, b, Math.sin(t * 1.3 + b.phase) * 0.07));
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
