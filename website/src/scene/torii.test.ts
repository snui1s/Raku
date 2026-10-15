import { describe, expect, it } from "vitest";
import { Box3, PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";
import { TORII, buildTorii } from "./torii";

const gate = () => {
  const g = buildTorii(PALETTE);
  g.updateMatrixWorld(true);
  return g;
};

describe("buildTorii", () => {
  it("has exactly two pillars, both taller than 90% of the gate height", () => {
    const g = gate();
    const pillars = g.children.filter((c) => c.name.startsWith("pillar-"));
    expect(pillars.map((p) => p.name).sort()).toEqual(["pillar-left", "pillar-right"]);
    for (const p of pillars) {
      const box = new Box3().setFromObject(p);
      expect(box.max.y - box.min.y).toBeGreaterThan(TORII.height * 0.9);
    }
  });

  it("has a kasagi wider than the pillar span", () => {
    const g = gate();
    const kasagi = g.getObjectByName("kasagi")!;
    const box = new Box3().setFromObject(kasagi);
    const width = box.max.x - box.min.x;
    // the gate is yawed, so compare against the span measured along the beam
    expect(width * Math.cos((TORII.yawDeg * Math.PI) / 180)).toBeGreaterThan(TORII.halfSpan * 2);
  });

  it("looks taller on screen on the near (right) pillar: perspective", () => {
    const g = gate();
    const cam = new PerspectiveCamera(CAMERA.fov, 1.6, 0.1, 500);
    cam.position.set(...CAMERA.position);
    cam.lookAt(new Vector3(...CAMERA.target));
    cam.updateMatrixWorld(true);
    const screenHeight = (name: string) => {
      const box = new Box3().setFromObject(g.getObjectByName(name)!);
      const c = box.getCenter(new Vector3());
      const base = new Vector3(c.x, box.min.y, c.z).project(cam);
      const top = new Vector3(c.x, box.max.y, c.z).project(cam);
      return top.y - base.y;
    };
    expect(screenHeight("pillar-right")).toBeGreaterThan(screenHeight("pillar-left"));
  });
});
