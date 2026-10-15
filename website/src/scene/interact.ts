// The small pure pieces behind the playful bits of the scene: what a click or a pointer movement means.
import type { Object3D, Vector3 } from "three";

export type SceneHit = { kind: "fox" } | { kind: "tree"; point: Vector3 } | { kind: "star"; index: number };

/** Only a press and release on the same object counts. Dragging, scrolling and cancellation abandon the tap. */
export function createSceneTap() {
  let press: { id: number; x: number; y: number; hit: SceneHit } | null = null;
  const move = (id: number, x: number, y: number) => {
    if (press?.id === id && Math.hypot(x - press.x, y - press.y) > 8) press = null;
  };
  return {
    begin(id: number, x: number, y: number, hit: SceneHit | null) { press = hit ? { id, x, y, hit } : null; },
    move,
    cancel() { press = null; },
    end(id: number, x: number, y: number, hit: SceneHit | null): SceneHit | null {
      move(id, x, y);
      if (!press || press.id !== id) return null;
      const original = press.hit;
      press = null;
      if (!hit || original.kind !== hit.kind) return null;
      if (original.kind === "star" && hit.kind === "star" && original.index !== hit.index) return null;
      return hit;
    },
  };
}

/** Dispatch to just the selected object; the tree owns its petal shower, without changing the scene's wind. */
export function activateSceneHit(hit: SceneHit, targets: {
  fox?: { react(): void };
  tree?: { shake(): void };
  petals?: { burst(origin: Vector3): void };
  shooting?: { shoot(origin: Vector3): void };
  blossom: Vector3;
  stars: Vector3[];
}) {
  if (hit.kind === "fox") targets.fox?.react();
  else if (hit.kind === "tree") {
    targets.tree?.shake();
    targets.petals?.burst(targets.blossom.clone().lerp(hit.point, 0.4));
  } else targets.shooting?.shoot(targets.stars[hit.index]);
}

/** The index of the point nearest (x, y) that is visible and within `maxDist` pixels, or -1 if there is none. */
export function nearestPoint(points: { x: number; y: number; visible: boolean }[], x: number, y: number, maxDist: number): number {
  let best = -1, bestD = maxDist;
  points.forEach((p, i) => {
    if (!p.visible) return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= bestD) { best = i; bestD = d; }
  });
  return best;
}

/** What a ray hit: the fox, the tree, or something else that only gets in the way (the hill, the gate). Looks up
 *  the parents of the mesh that was hit for the named object. */
export function classifyHit(object: Object3D | null): "fox" | "tree" | "other" | null {
  if (!object) return null;
  for (let o: Object3D | null = object; o; o = o.parent) {
    if (o.name === "fox") return "fox";
    if (o.name === "tree") return "tree";
  }
  return "other";
}

/** How much wind a pointer movement makes: nothing for a slow drift, more for a quick sweep (distance in pixels, over
 *  `ms` milliseconds). A single event never adds more than 0.3, so a flick is a gust and not a storm. */
export function pointerWind(distancePx: number, ms: number): number {
  if (distancePx <= 0 || ms <= 0) return 0;
  const speed = distancePx / ms; // pixels per millisecond
  if (speed < 0.5) return 0;
  return Math.min(0.3, distancePx / 1500);
}
