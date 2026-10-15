import {
  Color, Group, Mesh, MeshToonMaterial, PlaneGeometry, type Object3D, type Texture,
} from "three";
import type { Palette } from "./palette";

/** Ground height at (x, z). The camera is at y = 0 at the foot of the hill; ground rises with distance and toward the right. */
export function hillHeight(x: number, z: number): number {
  const d = Math.max(0, -z);
  const crestFall = 0.15 * Math.max(0, d - 16); // flattens and drops past the crest
  return -2 + 0.26 * d - crestFall + 0.1 * x - 0.004 * x * x + Math.sin(x * 0.11 + 1.3) * 0.4 + Math.sin(z * 0.17) * 0.3;
}

/** Main hill and a lower far hill behind it. The main hill receives shadows. */
export function buildHill(palette: Palette, toonGradient: Texture): Object3D {
  const make = (width: number, depth: number, color: number, z: number, lift: number, fn: (x: number, z: number) => number) => {
    const g = new PlaneGeometry(width, depth, 90, 60);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, fn(pos.getX(i), pos.getZ(i) + z) + lift);
    }
    g.computeVertexNormals();
    const m = new Mesh(g, new MeshToonMaterial({ color: new Color(color), gradientMap: toonGradient }));
    m.position.z = z;
    return m;
  };
  const near = make(140, 70, palette.hill, -32, 0, hillHeight);
  near.receiveShadow = true;
  const far = make(240, 90, palette.hillFar, -95, 0, (x, z) => 6 + 0.14 * Math.max(0, -z) + Math.sin(x * 0.05) * 5 + Math.sin(z * 0.08) * 2);
  const group = new Group();
  group.add(far, near);
  group.name = "hill";
  return group;
}
