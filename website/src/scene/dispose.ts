import type { Object3D } from "three";

/** Frees the geometry, materials and their alpha maps of everything under `root` (textures are not freed by disposing a material). */
export function disposeTree(root: Object3D) {
  root.traverse((o) => {
    type Disposable = { dispose(): void; alphaMap?: Disposable | null };
    const m = o as unknown as { geometry?: Disposable; material?: Disposable | Disposable[] };
    m.geometry?.dispose();
    for (const x of Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) {
      x.alphaMap?.dispose();
      x.dispose();
    }
  });
}
