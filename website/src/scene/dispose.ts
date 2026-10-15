import type { Object3D } from "three";

/** Frees geometry, materials and their colour/alpha maps (disposing a material alone does not free textures). */
export function disposeTree(root: Object3D) {
  root.traverse((o) => {
    type Disposable = { dispose(): void; map?: Disposable | null; alphaMap?: Disposable | null };
    const m = o as unknown as { geometry?: Disposable; material?: Disposable | Disposable[] };
    m.geometry?.dispose();
    for (const x of Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) {
      x.alphaMap?.dispose();
      if (x.map !== x.alphaMap) x.map?.dispose();
      x.dispose();
    }
  });
}
