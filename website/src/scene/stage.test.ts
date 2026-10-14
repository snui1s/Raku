import { describe, expect, it } from "vitest";
import { Color, PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";
import { FLIPPED_TARGET, STAGE, applyFlip, flipSky, resetFlip, stageHeightVh, stageTimeline } from "./stage";

describe("stageTimeline", () => {
  it("starts on the hero with nothing started", () => {
    expect(stageTimeline(0)).toEqual({ flip: 0, feature: 0 });
    expect(stageTimeline(-3)).toEqual(stageTimeline(0)); // overscroll above the stage
    expect(stageTimeline(STAGE.holdVh).flip).toBe(0);
  });

  it("flips first, then shows features", () => {
    const flipped = STAGE.holdVh + STAGE.flipVh;
    expect(stageTimeline(flipped - 0.01).flip).toBeLessThan(1);
    expect(stageTimeline(flipped - 0.01).feature).toBe(0);
    expect(stageTimeline(flipped).flip).toBe(1);
    expect(stageTimeline(flipped + STAGE.itemVh * 2.5).feature).toBeCloseTo(2.5);
  });

  it("never goes past the last feature, and never runs backwards", () => {
    expect(stageTimeline(1000)).toEqual({ flip: 1, feature: STAGE.items });
    let prev = stageTimeline(0);
    for (let s = 0; s <= stageHeightVh() + 2; s += 0.05) {
      const t = stageTimeline(s);
      expect(t.flip).toBeGreaterThanOrEqual(prev.flip);
      expect(t.feature).toBeGreaterThanOrEqual(prev.feature);
      prev = t;
    }
  });

  it("is only as tall as its parts plus the pinned frame", () => {
    expect(stageHeightVh()).toBeCloseTo(STAGE.holdVh + STAGE.flipVh + STAGE.itemVh * STAGE.items + 1);
  });
});

describe("applyFlip", () => {
  const make = () => new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
  /** The camera's own "up" in world space: which way the top of the screen points. */
  const screenUp = (cam: PerspectiveCamera) => new Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const forward = (cam: PerspectiveCamera) => new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);

  it("is exactly the hero camera when the flip has not begun", () => {
    const cam = make();
    applyFlip(cam, 0, 0);
    const hero = make();
    hero.position.set(...CAMERA.position);
    hero.lookAt(new Vector3(...CAMERA.target));
    expect(cam.position.toArray()).toEqual(CAMERA.position);
    expect(cam.quaternion.angleTo(hero.quaternion)).toBeLessThan(1e-6);
    expect(cam.fov).toBe(CAMERA.fov);
  });

  it("ends upside down: the top of the screen points at the ground, and the camera still looks the same way", () => {
    const cam = make();
    applyFlip(cam, 1, 0);
    expect(screenUp(cam).y).toBeLessThan(-0.85);
    expect(forward(cam).z).toBeLessThan(-0.85); // still looking into the scene, not turned around
    const toTarget = new Vector3(...FLIPPED_TARGET).sub(cam.position).normalize();
    expect(forward(cam).distanceTo(toTarget)).toBeLessThan(1e-6);
  });

  it("rolls steadily: the screen's up leans further from the sky at every step", () => {
    const cam = make();
    let prev = -Infinity;
    for (let f = 0; f <= 1.0001; f += 0.05) {
      applyFlip(cam, f, 0);
      const angle = Math.acos(Math.max(-1, Math.min(1, screenUp(cam).dot(new Vector3(0, 1, 0)))));
      expect(angle).toBeGreaterThanOrEqual(prev - 0.02); // the look direction also tilts a little while it rolls
      prev = angle;
    }
    expect(prev).toBeGreaterThan(Math.PI * 0.8);
  });

  it("opens the field of view mid-turn and settles back", () => {
    const cam = make();
    applyFlip(cam, 0.5, 0);
    expect(cam.fov).toBeGreaterThan(CAMERA.fov + 5);
    applyFlip(cam, 1, 0);
    expect(cam.fov).toBeLessThanOrEqual(CAMERA.fov + 0.01);
  });

  it("slides sideways with the features, and resetFlip undoes the roll", () => {
    const cam = make();
    applyFlip(cam, 1, 0);
    const x0 = cam.position.x;
    applyFlip(cam, 1, STAGE.items);
    expect(cam.position.x).toBeGreaterThan(x0);
    resetFlip(cam);
    expect(cam.up.toArray()).toEqual([0, 1, 0]);
    expect(cam.fov).toBe(CAMERA.fov);
  });
});

describe("flipSky", () => {
  it("is the night sky at first and a deeper violet once upside down", () => {
    expect(flipSky(0).getHex()).toBe(new Color(PALETTE.sky).getHex());
    const end = flipSky(1);
    expect(end.b).toBeGreaterThan(end.g); // violet, not grey
    expect(end.r + end.g + end.b).toBeLessThan(0.2); // still very dark
  });
});
