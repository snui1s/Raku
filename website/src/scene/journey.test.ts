import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { CONSTELLATION } from "./constellation";
import { JOURNEY, JOURNEY_AT, journeyAt, journeyHeightVh, journeyPose, projectPoints, type Pose } from "./journey";

// A stand-in for the fox close-up, so the timeline can be tested without building the scene
const FOX: Pose = { position: new Vector3(3, 2, -10), direction: new Vector3(0.5, 0, -1).normalize(), fov: 38 };
const dirOf = (s: number) => journeyPose(journeyAt(s), FOX).direction;
const SCROLLS = Array.from({ length: Math.ceil(journeyHeightVh() / 0.01) }, (_, i) => i * 0.01);

describe("journeyAt", () => {
  it("is the hero at scroll 0, and negative scroll counts as 0", () => {
    const s = journeyAt(0);
    expect(s).toMatchObject({ tilt: 0, feature: 0, skyBlend: 0, stars: 0, write: 0, numbers: 0, tag: 0 });
    expect(journeyAt(-3)).toEqual(s);
  });

  it("orders the chapters: stars, then write, then numbers, then the fox", () => {
    expect(JOURNEY_AT.stars).toBeCloseTo(CONSTELLATION.holdVh + CONSTELLATION.tiltVh, 9);
    expect(JOURNEY_AT.write).toBeGreaterThan(JOURNEY_AT.stars + CONSTELLATION.itemVh * CONSTELLATION.stars.length - 1e-9);
    expect(JOURNEY_AT.numbers).toBeGreaterThan(JOURNEY_AT.write);
    expect(JOURNEY_AT.fox).toBeGreaterThan(JOURNEY_AT.numbers);
  });

  it("keeps every value between 0 and 1 (feature up to the number of stars)", () => {
    for (const s of SCROLLS) {
      const j = journeyAt(s);
      for (const k of ["tilt", "skyBlend", "stars", "write", "numbers", "tag"] as const) {
        expect(j[k], `${k} at ${s}`).toBeGreaterThanOrEqual(0);
        expect(j[k], `${k} at ${s}`).toBeLessThanOrEqual(1);
      }
      expect(j.feature).toBeLessThanOrEqual(CONSTELLATION.stars.length);
    }
  });

  it("shows each thing in its own chapter", () => {
    const at = (s: number) => journeyAt(s);
    expect(at(JOURNEY_AT.stars + CONSTELLATION.itemVh * 2.5).stars).toBe(1);
    expect(at(JOURNEY_AT.stars + CONSTELLATION.itemVh * 2.5).write).toBe(0);
    const mid = JOURNEY_AT.write + JOURNEY.write / 2;
    expect(at(mid).write).toBe(1);
    expect(at(mid).stars).toBe(0);
    expect(at(mid).numbers).toBe(0);
    const nums = JOURNEY_AT.numbers + JOURNEY.numbers / 2;
    expect(at(nums).numbers).toBe(1);
    expect(at(nums).write).toBe(0);
    expect(at(JOURNEY_AT.fox + JOURNEY.toFox + JOURNEY.final).tag).toBe(1);
    expect(at(JOURNEY_AT.fox + JOURNEY.toFox + JOURNEY.final).numbers).toBe(0);
  });

  it("only moves forward: tilt, feature and tag never decrease", () => {
    let prev = journeyAt(0);
    for (const s of SCROLLS) {
      const j = journeyAt(s);
      expect(j.tilt).toBeGreaterThanOrEqual(prev.tilt);
      expect(j.feature).toBeGreaterThanOrEqual(prev.feature);
      expect(j.tag).toBeGreaterThanOrEqual(prev.tag);
      prev = j;
    }
  });

  it("is about ten screens tall at most", () => {
    expect(journeyHeightVh()).toBeGreaterThan(JOURNEY_AT.fox + JOURNEY.toFox + JOURNEY.final);
    expect(journeyHeightVh()).toBeLessThanOrEqual(11);
  });
});

describe("journeyPose", () => {
  it("is exactly the hero camera at scroll 0", () => {
    const p = journeyPose(journeyAt(0), FOX);
    const want = new Vector3(...CAMERA.target).sub(new Vector3(...CAMERA.position)).normalize();
    expect(p.position.distanceTo(new Vector3(...CAMERA.position))).toBeLessThan(1e-9);
    expect(p.direction.distanceTo(want)).toBeLessThan(1e-9);
    expect(p.fov).toBeCloseTo(CAMERA.fov, 9);
  });

  it("never jumps: close scroll positions give close cameras", () => {
    let prev = journeyPose(journeyAt(0), FOX);
    for (const s of SCROLLS) {
      const p = journeyPose(journeyAt(s), FOX);
      expect(p.position.distanceTo(prev.position), `position at ${s}`).toBeLessThan(0.2);
      expect(p.direction.distanceTo(prev.direction), `direction at ${s}`).toBeLessThan(0.03);
      expect(Math.abs(p.fov - prev.fov), `fov at ${s}`).toBeLessThan(0.3);
      prev = p;
    }
  });

  it("ends at the fox and holds there", () => {
    const end = journeyPose(journeyAt(journeyHeightVh()), FOX);
    expect(end.position.distanceTo(FOX.position)).toBeLessThan(1e-9);
    expect(end.direction.distanceTo(FOX.direction)).toBeLessThan(1e-9);
    expect(end.fov).toBeCloseTo(FOX.fov, 9);
  });

  it("holds still while the notebook is open and while the numbers are shown", () => {
    const a = dirOf(JOURNEY_AT.write + JOURNEY.write * 0.2), b = dirOf(JOURNEY_AT.write + JOURNEY.write * 0.8);
    expect(a.distanceTo(b)).toBeLessThan(1e-9);
    const c = dirOf(JOURNEY_AT.numbers + JOURNEY.numbers * 0.2), d = dirOf(JOURNEY_AT.numbers + JOURNEY.numbers * 0.8);
    expect(c.distanceTo(d)).toBeLessThan(1e-9);
  });

  it("comes back down from the sky: it looks well up at the last star and about level in the glade", () => {
    const up = dirOf(JOURNEY_AT.stars + CONSTELLATION.itemVh * CONSTELLATION.stars.length);
    expect(Math.asin(up.y) * (180 / Math.PI)).toBeGreaterThan(28);
    const glade = dirOf(JOURNEY_AT.write + 0.1);
    expect(Math.asin(glade.y) * (180 / Math.PI)).toBeLessThan(15);
  });

  it("takes the sky away on the way down", () => {
    expect(journeyAt(JOURNEY_AT.stars + CONSTELLATION.itemVh * 2).skyBlend).toBeGreaterThan(0.5);
    expect(journeyAt(JOURNEY_AT.write + 0.1).skyBlend).toBe(0);
  });
});

describe("projectPoints", () => {
  it("returns CSS pixels, and marks points behind the camera as hidden", () => {
    const c = new PerspectiveCamera(44, 1.6, 0.1, 500);
    c.position.set(0, 0, 0);
    c.lookAt(0, 0, -10);
    c.updateMatrixWorld(true);
    c.updateProjectionMatrix();
    const [front, behind] = projectPoints(c, 1600, 1000, [new Vector3(0, 0, -10), new Vector3(0, 0, 10)]);
    expect(front.visible).toBe(true);
    expect(front.x).toBeCloseTo(800, 3);
    expect(front.y).toBeCloseTo(500, 3);
    expect(behind.visible).toBe(false);
  });
});
