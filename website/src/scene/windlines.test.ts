import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial } from "three";
import { PALETTE } from "./palette";
import { windGust } from "./wind";
import { WIND_LINES, buildWindLines } from "./windlines";

const lines = (o: { children: unknown[] }) => o.children as Mesh[];
const opacity = (m: Mesh) => (m.material as MeshBasicMaterial).opacity;

describe("wind lines", () => {
  it("builds the configured number of streaks", () => {
    expect(lines(buildWindLines(PALETTE.light).object)).toHaveLength(WIND_LINES.count);
  });

  it("are invisible when the air is calm", () => {
    const { object, update } = buildWindLines(PALETTE.light);
    let calm = 0;
    while (windGust(calm) > 0.02) calm += 0.1;
    update!(calm, 1 / 60);
    for (const m of lines(object)) expect(opacity(m)).toBeLessThan(0.02);
  });

  it("show up in a gust and stay inside the scene while moving right to left", () => {
    const { object, update } = buildWindLines(PALETTE.light);
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
