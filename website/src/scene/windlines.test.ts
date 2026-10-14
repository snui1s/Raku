import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial } from "three";
import { windGust } from "./wind";
import { WIND_LINES, buildWindLines, windStreakPoints } from "./windlines";

const lines = (o: { children: unknown[] }) => o.children as Mesh[];
const opacity = (m: Mesh) => (m.material as MeshBasicMaterial).opacity;

describe("windStreakPoints", () => {
  it("flows left without curling back, and starts and ends on the centre line", () => {
    const pts = windStreakPoints(5, 0.3, 1.6, 1.2, 48);
    for (let i = 1; i < pts.length; i++) expect(pts[i][0]).toBeLessThan(pts[i - 1][0]);
    expect(pts[0][1]).toBeCloseTo(0);
    expect(Math.abs(pts[pts.length - 1][1])).toBeLessThan(0.05);
  });

  it("stays gently sloped (no loops or hooks)", () => {
    const pts = windStreakPoints(3.6, 0.22, 1.6, 0, 48); // steepest values buildWindLines can pick
    for (let i = 1; i < pts.length; i++) {
      const slope = Math.abs((pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]));
      expect(slope).toBeLessThan(1);
    }
  });
});

describe("wind lines", () => {
  it("builds the configured number of streaks", () => {
    expect(lines(buildWindLines().object)).toHaveLength(WIND_LINES.count);
  });

  it("are invisible when the air is calm", () => {
    const { object, update } = buildWindLines();
    let calm = 0;
    while (windGust(calm) > 0.02) calm += 0.1;
    update!(calm, 1 / 60);
    for (const m of lines(object)) expect(opacity(m)).toBeLessThan(0.02);
  });

  it("show up in a gust and stay inside the scene while moving right to left", () => {
    const { object, update } = buildWindLines();
    let t = 0;
    while (windGust(t) < 0.85) t += 0.1;
    update!(t, 1 / 60);
    const visible = lines(object).filter((m) => opacity(m) > 0.05);
    expect(visible.length).toBeGreaterThan(0);
    for (const m of lines(object)) {
      expect(m.position.x).toBeGreaterThanOrEqual(WIND_LINES.xMin - 1);
      expect(m.position.x).toBeLessThanOrEqual(WIND_LINES.xMax + 1);
    }
    const x0 = visible[0].position.x;
    update!(t + 0.1, 1 / 60);
    expect(visible[0].position.x).toBeLessThan(x0);
  });
});
