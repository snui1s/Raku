import { describe, expect, it } from "vitest";
import { InstancedMesh, Mesh, Vector3, type Object3D } from "three";
import { CONSTELLATION } from "./constellation";
import { JOURNEY, JOURNEY_AT, journeyAt, journeyPose, lookingAtSky } from "./journey";
import { PALETTE } from "./palette";
import { buildFlowers } from "./flowers";
import { buildLanterns } from "./lanterns";
import { buildFox } from "./fox";
import { buildTree } from "./tree";
import { buildHill } from "./hill";
import { buildGrass } from "./grass";
import { buildPetals } from "./petals";
import { buildRiverside } from "./riverside";
import { buildTorii } from "./torii";

/** Triangles drawn for an object (every instance counts). */
function triangles(o: Object3D): number {
  let n = 0;
  o.traverse((c) => {
    const m = c as Mesh;
    if (!m.isMesh) return;
    const g = m.geometry, per = g.index ? g.index.count / 3 : g.getAttribute("position").count / 3;
    n += per * ((m as InstancedMesh).isInstancedMesh ? (m as InstancedMesh).count : 1);
  });
  return Math.round(n);
}

// The scene was measured at about 127,000 triangles at first, and grew past 460,000 when the flowers and lanterns were
// made much more detailed. These limits keep it from growing back: they are what a modest laptop can draw at 60 fps.
describe("the scene's triangle budget", () => {
  const parts = {
    flowers: buildFlowers(PALETTE),
    lanterns: buildLanterns(),
    fox: buildFox(PALETTE),
    tree: buildTree(PALETTE),
    hill: { object: buildHill(PALETTE, undefined as never) },
    grass: buildGrass(PALETTE, undefined as never),
    petals: buildPetals(PALETTE),
    riverside: buildRiverside(PALETTE, undefined as never),
    torii: { object: buildTorii(PALETTE) },
  };
  const count = Object.fromEntries(Object.entries(parts).map(([k, p]) => [k, triangles(p.object)]));

  it("keeps the flowers under 170,000 (they were 320,000)", () => {
    expect(count.flowers).toBeLessThan(170_000);
    expect(count.flowers).toBeGreaterThan(40_000); // and still detailed: a field of real flowers, not dots
  });

  it("keeps the lanterns under 36,000 (they were 59,000)", () => {
    expect(count.lanterns).toBeLessThan(36_000);
  });

  it("keeps the fox under 5,000 (it was 10,600)", () => {
    expect(count.fox).toBeLessThan(5_000);
  });

  it("keeps the whole scene under 300,000", () => {
    expect(Object.values(count).reduce((a, b) => a + b, 0)).toBeLessThan(300_000);
  });

  it("still has a tree, a hill and the rest (nothing was dropped to meet the budget)", () => {
    expect(count.tree).toBeGreaterThan(30_000);
    expect(count.hill).toBeGreaterThan(15_000);
  });
});

describe("flowers are not drawn while the camera looks up at the stars", () => {
  it("hides them in the stars chapter, and only there", () => {
    expect(lookingAtSky(journeyAt(0))).toBe(false); // the hero: the whole field is in view
    expect(lookingAtSky(journeyAt(JOURNEY_AT.stars * 0.6))).toBe(false); // still tilting up: the field is partly in view
    expect(lookingAtSky(journeyAt(JOURNEY_AT.stars))).toBe(true);
    expect(lookingAtSky(journeyAt(JOURNEY_AT.stars + CONSTELLATION.itemVh * 2.5))).toBe(true);
    expect(lookingAtSky(journeyAt(JOURNEY_AT.write - JOURNEY.descent * 0.5))).toBe(false); // coming back down
    expect(lookingAtSky(journeyAt(JOURNEY_AT.write))).toBe(false);
    expect(lookingAtSky(journeyAt(JOURNEY_AT.numbers))).toBe(false);
    expect(lookingAtSky(journeyAt(JOURNEY_AT.fox + 1))).toBe(false);
  });

  it("never hides them when the camera could see any of the hill: the view is level enough in every frame they stay hidden", () => {
    // while hidden, the camera looks at least 30 degrees up (the lowest edge of the view is above the field)
    for (let s = 0; s < JOURNEY_AT.write; s += 0.02) {
      const state = journeyAt(s);
      if (!lookingAtSky(state)) continue;
      const pose = journeyPose(state, { position: new Vector3(), direction: new Vector3(0, 0, -1), fov: 38 });
      const pitch = Math.asin(pose.direction.y) * (180 / Math.PI), lowestEdge = pitch - pose.fov / 2;
      expect(lowestEdge, `at scroll ${s}`).toBeGreaterThan(14);
    }
  });
});

describe("lantern geometry", () => {
  it("is still round: no fewer than 24 sides, and ribs left to the shader", () => {
    const { object } = buildLanterns();
    const body = object.getObjectByName("lantern-0-body") as Mesh;
    const positions = body.geometry.getAttribute("position");
    const ring = new Set<string>();
    for (let i = 0; i < positions.count; i++) if (Math.abs(positions.getY(i)) < 1e-6) ring.add(`${positions.getX(i).toFixed(3)},${positions.getZ(i).toFixed(3)}`);
    expect(ring.size).toBeGreaterThanOrEqual(24);
  });
});
