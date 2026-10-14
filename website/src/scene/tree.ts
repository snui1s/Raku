import {
  BufferGeometry, Color, CubicBezierCurve3, CylinderGeometry, DoubleSide, Euler, Float32BufferAttribute, Group,
  InstancedMesh, Matrix4, Mesh, MeshToonMaterial, Object3D, Quaternion, Shape, ShapeGeometry, Vector3,
  type Texture,
} from "three";
import { hillHeight } from "./hill";
import { mulberry32 } from "./rng";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Local coordinates: origin at the foot of the trunk, y up, +x to the right on screen. Meters. */
export const TREE = {
  forkY: 5.2, // where the trunk splits into branches
  position: [8.2, 0, -19.5] as [number, number, number], // x, (y comes from the hill), z
};

export interface TreeStats {
  blossoms: number;
  leaves: number;
  branches: number;
}

const v = (x: number, y: number, z = 0) => new Vector3(x, y, z);

/** Tube along a bezier whose radius tapers from r0 to r1. */
function taperedTube(c: CubicBezierCurve3, r0: number, r1: number, tubular = 24, radial = 10): BufferGeometry {
  const frames = c.computeFrenetFrames(tubular, false);
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular, p = c.getPoint(t), r = r0 + (r1 - r0) * t;
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2, cos = Math.cos(a), sin = Math.sin(a);
      const n = frames.normals[i], b = frames.binormals[i];
      pos.push(p.x + r * (cos * n.x + sin * b.x), p.y + r * (cos * n.y + sin * b.y), p.z + r * (cos * n.z + sin * b.z));
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j, b = i * radial + ((j + 1) % radial), c2 = a + radial, d = b + radial;
      idx.push(a, c2, b, b, c2, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// trunk and the six branches: [control points, start radius, end radius]
const TRUNK = new CubicBezierCurve3(v(0, -0.3), v(-0.1, 1.8), v(-0.3, 3.6), v(-0.45, TREE.forkY));
const BRANCHES: [CubicBezierCurve3, number, number][] = [
  [new CubicBezierCurve3(v(-0.4, 4.8), v(-1.6, 5.0), v(-3.0, 5.9), v(-4.6, 5.9)), 0.52, 0.09],
  [new CubicBezierCurve3(v(-0.4, 5.0), v(-0.9, 6.2), v(-2.2, 7.4), v(-3.4, 8.0)), 0.46, 0.08],
  [new CubicBezierCurve3(v(-0.4, 4.9), v(1.0, 5.6), v(2.6, 6.2), v(4.3, 6.9)), 0.5, 0.09],
  [new CubicBezierCurve3(v(-0.4, 5.1), v(-0.2, 6.4), v(0.2, 8.0), v(0.6, 9.2)), 0.42, 0.07],
  [new CubicBezierCurve3(v(-2.4, 5.5), v(-2.6, 5.0), v(-3.0, 4.6), v(-3.6, 4.5)), 0.12, 0.04],
  [new CubicBezierCurve3(v(-1.6, 6.6), v(-1.2, 7.4), v(-0.6, 8.2), v(-0.2, 8.8)), 0.16, 0.04],
];

// canopy clouds: [cx, cy, cz, rx, ry, rz]
const CLOUDS: [number, number, number, number, number, number][] = [
  [-3.2, 6.6, 0, 3.2, 1.9, 1.7], [0.1, 8.1, 0, 4.0, 2.4, 2.0], [3.6, 6.9, 0, 2.9, 2.5, 1.8],
  [-0.3, 5.9, 0.2, 3.6, 1.3, 1.7], [-4.5, 5.6, 0, 1.8, 1.0, 1.2], [1.4, 9.4, 0, 2.2, 1.3, 1.3],
];

/** Five-lobed flower outline, radius about 1. */
function flowerGeometry(): ShapeGeometry {
  const s = new Shape(), N = 40;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, r = 0.72 + 0.28 * Math.cos(5 * a);
    i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new ShapeGeometry(s);
}

function leafGeometry(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.3, 0.25, 0.8, 0.25, 1.2, 0); s.bezierCurveTo(0.8, -0.25, 0.3, -0.25, 0, 0);
  return new ShapeGeometry(s);
}

export function buildTree(palette: Palette, toon?: Texture, seed = 7): ScenePart & { stats: TreeStats } {
  const rng = mulberry32(seed);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const mat = (color: number, extra: object = {}) => new MeshToonMaterial({ color, gradientMap: toon ?? null, ...extra });

  const tree = new Group();
  tree.name = "sakura";
  const wood = mat(palette.bark);
  const barkDark = mat(palette.barkDark);

  // trunk, root flare and branches
  tree.add(new Mesh(taperedTube(TRUNK, 1.1, 0.68, 28, 16), wood));
  const flare = new Mesh(new CylinderGeometry(1.1, 1.75, 0.8, 16), wood);
  flare.position.y = 0.05;
  tree.add(flare);
  const shade = new Mesh(taperedTube(TRUNK, 0.55, 0.34, 28, 8), barkDark); // darker core line gives the trunk depth
  shade.position.set(0.36, 0, 0.45);
  tree.add(shade);
  BRANCHES.forEach(([c, a, b]) => tree.add(new Mesh(taperedTube(c, a, b), wood)));

  // canopy
  const canopy = new Group();
  canopy.name = "canopy";
  tree.add(canopy);

  const flower = flowerGeometry();
  const m4 = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3(), col = new Color();
  const volume = CLOUDS.map(([, , , rx, ry, rz]) => rx * ry * rz);
  const totalVolume = volume.reduce((x, y) => x + y, 0);
  const pickCloud = () => {
    let t = rng() * totalVolume, i = 0;
    while (i < CLOUDS.length - 1 && t > volume[i]) t -= volume[i++];
    return CLOUDS[i];
  };
  const inBall = (): [number, number, number] => {
    for (;;) {
      const x = r(-1, 1), y = r(-1, 1), z = r(-1, 1);
      if (x * x + y * y + z * z <= 1) return [x, y, z];
    }
  };

  function layer(name: string, count: number, colors: number[], size: number, zOffset: number, grow: number) {
    const mesh = new InstancedMesh(flower, mat(0xffffff, { side: DoubleSide }), count);
    mesh.name = name;
    for (let i = 0; i < count; i++) {
      const [cx, cy, cz, rx, ry, rz] = pickCloud();
      const [ux, uy, uz] = inBall();
      p.set(cx + ux * rx * grow, cy + uy * ry * grow, cz + uz * rz * 0.45 + zOffset);
      e.set(r(-0.6, 0.6), r(-0.6, 0.6), r(0, Math.PI * 2));
      q.setFromEuler(e);
      const sc = size * r(0.8, 1.35);
      s.set(sc, sc, sc);
      mesh.setMatrixAt(i, m4.compose(p, q, s));
      mesh.setColorAt(i, col.setHex(colors[Math.floor(rng() * colors.length)]));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    canopy.add(mesh);
    return count;
  }
  const [b0, b1, b2, b3] = palette.blossom;
  let blossoms = 0;
  blossoms += layer("blossoms-back", 260, [b0, b1], 0.62, -1.1, 1.02);
  blossoms += layer("blossoms-mid", 330, [b1, b2], 0.52, 0.0, 0.98);
  blossoms += layer("blossoms-front", 240, [b2, b3], 0.44, 1.1, 0.94);
  blossoms += layer("blossoms-edge", 60, [b3], 0.34, 0.4, 1.08);

  // a few young leaves
  const leaves = 40;
  const leafMesh = new InstancedMesh(leafGeometry(), mat(palette.leaf, { side: DoubleSide }), leaves);
  leafMesh.name = "leaves";
  for (let i = 0; i < leaves; i++) {
    const [cx, cy, cz, rx, ry, rz] = pickCloud();
    const [ux, uy, uz] = inBall();
    p.set(cx + ux * rx * 0.98, cy + uy * ry * 0.98, cz + uz * rz * 0.45 + r(-0.6, 1.2));
    q.setFromEuler(e.set(r(-0.5, 0.5), r(-0.5, 0.5), r(0, Math.PI * 2)));
    const sc = r(0.3, 0.5);
    leafMesh.setMatrixAt(i, m4.compose(p, q, s.set(sc, sc, sc)));
  }
  canopy.add(leafMesh);

  const o = new Object3D();
  tree.scale.setScalar(0.82);
  o.add(tree);
  const [tx, , tz] = TREE.position;
  o.position.set(tx, hillHeight(tx, tz) - 0.2, tz);
  return {
    object: o,
    stats: { blossoms, leaves, branches: BRANCHES.length },
    update: (t) => {
      canopy.rotation.z = Math.sin(t * 0.7) * 0.006; // gentle sway around the fork
    },
  };
}
