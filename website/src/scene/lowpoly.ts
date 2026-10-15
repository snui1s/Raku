import { BufferAttribute, BufferGeometry, Color, Float32BufferAttribute, Vector3, type Curve } from "three";

/** A copy of `geometry` with flat faces, each face a slightly different shade of `color` (up to `jitter` lighter or
 *  darker), so it reads as cut facets. The shade is stored as vertex colors: use a material with `vertexColors`. */
export function faceted(geometry: BufferGeometry, color: number, rng: () => number, jitter = 0.1): BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  g.computeVertexNormals(); // every triangle has its own vertices, so each face gets one normal: flat shading
  const base = new Color(color), count = g.getAttribute("position").count;
  const colors = new Float32Array(count * 3);
  for (let f = 0; f < count / 3; f++) {
    const k = 1 + (rng() * 2 - 1) * jitter;
    for (let v = 0; v < 3; v++) colors.set([base.r * k, base.g * k, base.b * k], (f * 3 + v) * 3);
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  return g;
}

/** A flat-shaded tube along `curve` with a few sides, wider or narrower as `radiusAt(t)` says, and a color along its
 *  length from `colorAt(t)` (t runs from 0 at the start to 1 at the end). Each face has its own shade, as in `faceted`. */
export function facetedTube(
  curve: Curve<Vector3>, radiusAt: (t: number) => number, colorAt: (t: number) => number,
  segments: number, radial: number, rng: () => number, jitter = 0.1,
): BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const ring = (i: number) => {
    const t = i / segments, c = curve.getPointAt(t), r = radiusAt(t);
    return Array.from({ length: radial }, (_, j) => {
      const a = (j / radial) * Math.PI * 2;
      return c.clone().addScaledVector(frames.normals[i], Math.cos(a) * r).addScaledVector(frames.binormals[i], Math.sin(a) * r);
    });
  };
  const pos: number[] = [], col: number[] = [];
  let prev = ring(0);
  for (let i = 0; i < segments; i++) {
    const next = ring(i + 1), shade = new Color(colorAt((i + 0.5) / segments));
    for (let j = 0; j < radial; j++) {
      const a = prev[j], b = prev[(j + 1) % radial], c = next[j], d = next[(j + 1) % radial];
      for (const tri of [[a, c, b], [b, c, d]]) {
        const k = 1 + (rng() * 2 - 1) * jitter;
        for (const p of tri) { pos.push(p.x, p.y, p.z); col.push(shade.r * k, shade.g * k, shade.b * k); }
      }
    }
    prev = next;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
