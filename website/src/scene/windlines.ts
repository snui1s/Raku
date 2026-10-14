import { CatmullRomCurve3, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { mulberry32 } from "./rng";
import { taperedTube } from "./tree";
import { windGust } from "./wind";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Thin curling streaks that sweep from right to left when a gust blows. */
export const WIND_LINES = { count: 8, xMin: -16, xMax: 14 };

export function buildWindLines(palette: Palette): ScenePart {
  const rng = mulberry32(21);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const group = new Group();
  group.name = "wind-lines";

  // one streak shape: a long swoosh that ends in a small curl
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0, 0), new Vector3(-1.3, 0.14, 0), new Vector3(-2.7, -0.08, 0), new Vector3(-3.9, 0.22, 0),
    new Vector3(-4.7, 0.72, 0), new Vector3(-4.3, 1.15, 0), new Vector3(-3.75, 0.88, 0), new Vector3(-3.95, 0.42, 0),
  ]);
  const geometry = taperedTube(curve, 0.035, 0.008, 40, 5);
  const color = palette.night ? 0xcdd9ea : 0xb7cbe0;

  const items = Array.from({ length: WIND_LINES.count }, () => {
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    mesh.position.set(0, r(2.4, 10.5), r(-22, -9));
    mesh.scale.setScalar(r(0.85, 1.6));
    mesh.visible = false;
    group.add(mesh);
    return { mesh, threshold: r(0.2, 0.7), speed: r(0.28, 0.42), offset: r(0, 1) };
  });

  return {
    object: group,
    update: (t) => {
      const g = windGust(t);
      for (const it of items) {
        const progress = (t * it.speed + it.offset) % 1;
        it.mesh.position.x = WIND_LINES.xMax + (WIND_LINES.xMin - WIND_LINES.xMax) * progress; // right to left
        const strength = Math.min(1, Math.max(0, (g - it.threshold) / 0.3));
        const opacity = strength * Math.sin(Math.PI * progress) * 0.6;
        (it.mesh.material as MeshBasicMaterial).opacity = opacity;
        it.mesh.visible = opacity > 0.01;
      }
    },
  };
}
