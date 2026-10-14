import { describe, expect, it } from "vitest";
import { InstancedMesh, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";
import { applyFlip } from "./stage";
import { VORTEX, buildWhirl, createHorizonFlash, flashStrength, horizonLine, whirlStrength } from "./vortex";

describe("whirlStrength", () => {
  it("is nothing at either end of the flip and strongest in the middle", () => {
    expect(whirlStrength(0)).toBeCloseTo(0);
    expect(whirlStrength(1)).toBeCloseTo(0);
    expect(whirlStrength(0.5)).toBeCloseTo(1);
    expect(whirlStrength(0.25)).toBeLessThan(whirlStrength(0.5));
    expect(whirlStrength(-1)).toBeCloseTo(0);
    expect(whirlStrength(2)).toBeCloseTo(0);
  });
});

describe("buildWhirl", () => {
  const sizeAt = (mesh: InstancedMesh, i: number) => {
    const m = new Matrix4(), p = new Vector3(), q = new Quaternion(), s = new Vector3();
    mesh.getMatrixAt(i, m);
    m.decompose(p, q, s);
    return { p, s };
  };

  it("has the configured number of petals, all inside the camera's view cone", () => {
    const w = buildWhirl(PALETTE);
    expect(w.mesh.count).toBe(VORTEX.count);
    w.update(1, 0.5, 44, 1.6);
    const half = Math.tan((44 * Math.PI) / 360);
    for (let i = 0; i < w.mesh.count; i++) {
      const { p } = sizeAt(w.mesh, i);
      expect(p.z).toBeLessThan(-VORTEX.zNear + 1e-6); // in front of the camera
      expect(p.z).toBeGreaterThan(-VORTEX.zFar - 1e-6);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(-p.z * half * 1.5); // within the field of view plus the spiral's reach
    }
  });

  it("is hidden when the world is not turning", () => {
    const w = buildWhirl(PALETTE);
    w.update(0, 0, 44, 1.6);
    expect(w.mesh.visible).toBe(false);
    w.update(0, 1, 44, 1.6);
    expect(w.mesh.visible).toBe(false);
    w.update(0, 0.5, 44, 1.6);
    expect(w.mesh.visible).toBe(true);
  });

  it("stretches the petals into streaks at full whirl, and they turn round the middle as the flip goes on", () => {
    const w = buildWhirl(PALETTE);
    w.update(0, 0.5, 44, 1.6);
    const full = sizeAt(w.mesh, 0).s;
    expect(full.x).toBeGreaterThan(full.y * 2);
    const before = sizeAt(w.mesh, 5).p.clone();
    w.update(0, 0.56, 44, 1.6);
    const after = sizeAt(w.mesh, 5).p;
    const swing = Math.abs(Math.atan2(after.y, after.x) - Math.atan2(before.y, before.x));
    expect(swing).toBeGreaterThan(0.1);
  });

  it("is deterministic", () => {
    const a = buildWhirl(PALETTE), b = buildWhirl(PALETTE);
    a.update(2, 0.4, 44, 1.6);
    b.update(2, 0.4, 44, 1.6);
    expect(Array.from(a.mesh.instanceMatrix.array)).toEqual(Array.from(b.mesh.instanceMatrix.array));
  });
});

describe("horizonLine", () => {
  const camera = (flip: number) => {
    const c = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    applyFlip(c, flip, 0);
    return c;
  };
  /** Where the line crosses the middle of the screen (x = 0), as a y in -1..1. */
  const yAtCentre = (l: { b: number; c: number }) => -l.c / l.b;
  /** The line's tilt from level, in degrees, accounting for the screen's shape. */
  const tilt = (l: { a: number; b: number }, aspect = 1.6) => {
    const deg = Math.abs((Math.atan2(l.a / aspect, l.b) * 180) / Math.PI) % 180; // a line has no direction, so 180 is level
    return Math.min(deg, 180 - deg);
  };

  it("is level, and below the middle of the screen, in the hero (the camera looks a little up)", () => {
    const l = horizonLine(camera(0));
    expect(tilt(l)).toBeLessThan(1.5);
    expect(yAtCentre(l)).toBeLessThan(0);
  });

  it("is turned a quarter at the half turn, and level again but above the middle once upside down", () => {
    expect(tilt(horizonLine(camera(0.5)))).toBeGreaterThan(70);
    const end = horizonLine(camera(1));
    expect(tilt(end)).toBeLessThan(1.5);
    expect(yAtCentre(end)).toBeGreaterThan(0);
  });
});

describe("createHorizonFlash", () => {
  it("peaks at the half turn and is gone at the ends", () => {
    expect(flashStrength(0.5)).toBeCloseTo(1);
    expect(flashStrength(0)).toBeLessThan(0.003);
    expect(flashStrength(1)).toBeLessThan(0.003);
    expect(flashStrength(0.3)).toBeLessThan(flashStrength(0.45));
  });

  it("only draws while it is bright enough, and passes the line on to the shader", () => {
    const f = createHorizonFlash();
    const view = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    applyFlip(view, 0.5, 0);
    expect(f.set(view, 0, 1)).toBe(false);
    expect(f.set(view, 0.5, 1)).toBe(true);
    const { a, b, c } = horizonLine(view);
    expect(f.material.uniforms.uLine.value.toArray()).toEqual([a, b, c]);
    expect(f.material.uniforms.uAspect.value).toBe(1.6);
  });
});
