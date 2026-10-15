import { describe, expect, it } from "vitest";
import { Color, CubicBezierCurve3, IcosahedronGeometry, Vector3 } from "three";
import { faceted, facetedTube } from "./lowpoly";
import { mulberry32 } from "./rng";

const triangles = (g: ReturnType<typeof faceted>) => g.getAttribute("position").count / 3;
const normalOf = (g: ReturnType<typeof faceted>, f: number, v: number) => {
  const n = g.getAttribute("normal");
  return new Vector3(n.getX(f * 3 + v), n.getY(f * 3 + v), n.getZ(f * 3 + v));
};
const colorOf = (g: ReturnType<typeof faceted>, f: number, v: number) => {
  const c = g.getAttribute("color");
  return [c.getX(f * 3 + v), c.getY(f * 3 + v), c.getZ(f * 3 + v)];
};

describe("faceted", () => {
  const make = (jitter = 0.1, seed = 1) => faceted(new IcosahedronGeometry(1, 1), 0xd9772f, mulberry32(seed), jitter);

  it("has no shared vertices: every triangle stands alone, so it can be flat", () => {
    const g = make();
    expect(g.index).toBeNull();
    expect(triangles(g)).toBe(80); // an icosahedron with one level of detail
  });

  it("has one normal per face, pointing away from the middle (flat shading)", () => {
    const g = make();
    for (let f = 0; f < triangles(g); f++) {
      const n0 = normalOf(g, f, 0);
      expect(normalOf(g, f, 1).distanceTo(n0)).toBeLessThan(1e-6);
      expect(normalOf(g, f, 2).distanceTo(n0)).toBeLessThan(1e-6);
      const p = g.getAttribute("position");
      const centre = new Vector3().add(new Vector3(p.getX(f * 3), p.getY(f * 3), p.getZ(f * 3))).add(new Vector3(p.getX(f * 3 + 1), p.getY(f * 3 + 1), p.getZ(f * 3 + 1))).add(new Vector3(p.getX(f * 3 + 2), p.getY(f * 3 + 2), p.getZ(f * 3 + 2)));
      expect(n0.dot(centre.normalize())).toBeGreaterThan(0.95);
    }
  });

  it("gives each face one color, and the faces slightly different shades of the same color", () => {
    const g = make(0.1);
    const c = new Color(0xd9772f), base = [c.r, c.g, c.b]; // the color in linear space, as three.js stores it
    const reds = new Set<number>();
    for (let f = 0; f < triangles(g); f++) {
      const c0 = colorOf(g, f, 0);
      expect(colorOf(g, f, 1)).toEqual(c0);
      expect(colorOf(g, f, 2)).toEqual(c0);
      reds.add(Math.round(c0[0] * 1e4));
      // brighter or darker, but the same hue: the three channels scale together
      expect(c0[1] / c0[0]).toBeCloseTo(base[1] / base[0], 3);
      expect(c0[2] / c0[0]).toBeCloseTo(base[2] / base[0], 3);
    }
    expect(reds.size).toBeGreaterThan(20); // many different shades
    const all = Array.from({ length: triangles(g) }, (_, f) => colorOf(g, f, 0)[0]);
    expect(Math.max(...all) / Math.min(...all)).toBeLessThan(1.25); // but only slightly different
  });

  it("is uniform with no jitter, and repeatable for a seed", () => {
    const flat = make(0);
    const first = colorOf(flat, 0, 0);
    for (let f = 0; f < triangles(flat); f++) expect(colorOf(flat, f, 0)).toEqual(first);
    expect(Array.from(make(0.1, 4).getAttribute("color").array)).toEqual(Array.from(make(0.1, 4).getAttribute("color").array));
    expect(Array.from(make(0.1, 4).getAttribute("color").array)).not.toEqual(Array.from(make(0.1, 5).getAttribute("color").array));
  });

  it("does not change the geometry it was given", () => {
    const src = new IcosahedronGeometry(1, 1);
    const before = src.getAttribute("position").count;
    faceted(src, 0xffffff, mulberry32(1));
    expect(src.getAttribute("position").count).toBe(before);
  });
});

describe("facetedTube", () => {
  const curve = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(-0.4, 0, 0.2), new Vector3(-0.3, 0, 0.5), new Vector3(0.5, 0, 0.4));
  const make = (seed = 1) => facetedTube(curve, (t) => 0.06 + 0.1 * Math.sin(Math.PI * t), (t) => (t > 0.7 ? 0xffffff : 0xff0000), 12, 6, mulberry32(seed), 0);

  it("is made of segments x sides x 2 flat triangles, with finite numbers everywhere", () => {
    const g = make();
    expect(triangles(g)).toBe(12 * 6 * 2);
    for (const name of ["position", "normal", "color"]) for (const v of g.getAttribute(name).array) expect(Number.isFinite(v)).toBe(true);
    for (let f = 0; f < triangles(g); f += 5) expect(normalOf(g, f, 1).distanceTo(normalOf(g, f, 0))).toBeLessThan(1e-6);
  });

  it("is colored along its length: the first part one color and the tip another", () => {
    const g = make();
    const per = 6 * 2, tint = (seg: number) => colorOf(g, seg * per, 0);
    expect(tint(1)[1]).toBeCloseTo(0, 6); // red: no green
    expect(tint(11)[1]).toBeGreaterThan(0.9); // white tip
  });

  it("follows the curve and gets wider in the middle than at the ends", () => {
    const g = make();
    const p = g.getAttribute("position");
    const spread = (seg: number) => {
      const per = 6 * 2 * 3, xs: number[] = [];
      for (let i = seg * per; i < (seg + 1) * per; i++) xs.push(new Vector3(p.getX(i), p.getY(i), p.getZ(i)).distanceTo(curve.getPointAt((seg + 0.5) / 12)));
      return Math.max(...xs);
    };
    expect(spread(6)).toBeGreaterThan(spread(0));
    expect(spread(6)).toBeGreaterThan(spread(11));
  });
});
