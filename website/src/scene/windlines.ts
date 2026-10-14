import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from "three";
import { mulberry32 } from "./rng";
import { windGust } from "./wind";
import type { ScenePart } from "./index";

/** Thin flowing streaks that drift from right to left when a gust blows. */
export const WIND_LINES = { count: 5, xMin: -16, xMax: 14 };

/** Centre line of one streak: runs left from the origin and rolls gently up and down, never doubling back. */
export function windStreakPoints(length: number, amplitude: number, waves: number, phase: number, segments: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const s = i / segments;
    pts.push([-length * s, amplitude * Math.sin(s * Math.PI * 2 * waves + phase) * Math.sin(Math.PI * Math.min(1, s * 1.15))]);
  }
  return pts;
}

/** A flat ribbon along the centre line, pointed at both ends so it reads as a wisp of air. */
function ribbon(points: [number, number][], maxWidth: number): BufferGeometry {
  const pos: number[] = [], idx: number[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = points[Math.max(0, i - 1)], [x1, y1] = points[Math.min(n - 1, i + 1)];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const half = (maxWidth / 2) * Math.pow(Math.sin(Math.PI * (i / (n - 1))), 0.8);
    const nx = (-dy / len) * half, ny = (dx / len) * half;
    pos.push(points[i][0] + nx, points[i][1] + ny, 0, points[i][0] - nx, points[i][1] - ny, 0);
    if (i < n - 1) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

export function buildWindLines(): ScenePart {
  const rng = mulberry32(21);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const group = new Group();
  group.name = "wind-lines";
  const color = 0xcdd9ea;

  const items = Array.from({ length: WIND_LINES.count }, () => {
    const geometry = ribbon(windStreakPoints(r(3.6, 6), r(0.12, 0.22), r(0.9, 1.6), r(0, Math.PI * 2), 48), 0.07);
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, fog: false, side: DoubleSide }));
    const y = r(2.4, 10.5);
    mesh.position.set(0, y, r(-22, -9));
    mesh.scale.setScalar(r(0.85, 1.6));
    mesh.visible = false;
    group.add(mesh);
    return { mesh, y, threshold: r(0.2, 0.7), speed: r(0.28, 0.42), offset: r(0, 1), bob: r(0, Math.PI * 2) };
  });

  return {
    object: group,
    update: (t) => {
      const g = windGust(t);
      for (const it of items) {
        const progress = (t * it.speed + it.offset) % 1;
        it.mesh.position.x = WIND_LINES.xMax + (WIND_LINES.xMin - WIND_LINES.xMax) * progress; // right to left
        it.mesh.position.y = it.y + Math.sin(t * 0.9 + it.bob) * 0.12; // slight lift and fall as it drifts
        const strength = Math.min(1, Math.max(0, (g - it.threshold) / 0.3));
        const opacity = strength * Math.sin(Math.PI * progress) * 0.45;
        (it.mesh.material as MeshBasicMaterial).opacity = opacity;
        it.mesh.visible = opacity > 0.01;
      }
    },
  };
}
