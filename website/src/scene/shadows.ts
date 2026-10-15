import { Vector3, type DirectionalLight } from "three";
import { FOX } from "./fox";
import { hillHeight } from "./hill";
import { MOON } from "./moon";
import { TORII } from "./torii";
import { TREE } from "./tree";

/** Where the sun is (the scene's main directional light, which lights the objects from the front-left). */
export const SUN_POSITION: [number, number, number] = [-8, 14, 6];

/**
 * Light levels. The moon's light is the one that casts shadows. It shines from behind the scene, so on its own it
 * would leave the sides facing the camera dark; the sun and ambient levels are lowered to make up for it, which keeps
 * the lit look close to what it was before shadows.
 */
export const LIGHTING = { ambient: 1.2, sun: 1.2, moon: 1.1 };

/** Unit vector from the origin toward the moon (same placement as the moon disc). */
export function moonDirection(): Vector3 {
  const el = (MOON.elevationDeg * Math.PI) / 180, az = (MOON.azimuthDeg * Math.PI) / 180;
  return new Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));
}

/** Where the shadow maker looks: the middle of the area that matters (gate, tree, fox and the ground in front). */
export const SHADOW_TARGET = new Vector3(5, 2, -13);
const SHADOW_DISTANCE = 90;

/** Points that must fall inside the shadow map: everything that casts a shadow, and the ground that receives it. */
export function shadowFitPoints(): Vector3[] {
  const pts: Vector3[] = [];
  const box = (cx: number, cz: number, rx: number, rz: number, up: number) => {
    const base = hillHeight(cx, cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [base - 0.5, base + up]) pts.push(new Vector3(cx + sx * rx, y, cz + sz * rz));
  };
  box(TORII.position[0], TORII.position[2], TORII.halfSpan + 1.5, 3, TORII.height + 4); // gate with its wide top beam
  box(TREE.position[0], TREE.position[2], 6, 3, 12); // trunk and the whole canopy
  box(FOX.position[0], FOX.position[2], 1, 1, 1.8);
  for (let x = -14; x <= 16; x += 6) for (let z = -24; z <= -3; z += 3.5) pts.push(new Vector3(x, hillHeight(x, z), z)); // the ground
  return pts;
}

export interface ShadowBounds { left: number; right: number; top: number; bottom: number; near: number; far: number }

/**
 * Tightest orthographic box around `points`, seen from a light that looks along -dir at `target` from `distance`
 * away. Tight means every shadow-map texel counts, so leaves stay crisp without a huge map.
 */
export function fitShadowBounds(dir: Vector3, target: Vector3, distance: number, points: Vector3[], margin = 1): ShadowBounds {
  const forward = dir.clone().negate().normalize(); // from the light toward the scene
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();
  const b = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity, near: Infinity, far: -Infinity };
  for (const p of points) {
    const rel = p.clone().sub(target);
    const x = rel.dot(right), y = rel.dot(up), depth = distance + rel.dot(forward);
    b.left = Math.min(b.left, x); b.right = Math.max(b.right, x);
    b.bottom = Math.min(b.bottom, y); b.top = Math.max(b.top, y);
    b.near = Math.min(b.near, depth); b.far = Math.max(b.far, depth);
  }
  return { left: b.left - margin, right: b.right + margin, bottom: b.bottom - margin, top: b.top + margin, near: Math.max(0.1, b.near - margin), far: b.far + margin };
}

/** Puts the moon light where the moon is and sets up its shadow map. The map is drawn once (see the scene), so it can be generous. */
export function configureMoonLight(light: DirectionalLight, mapSize = 2048) {
  const dir = moonDirection();
  light.position.copy(SHADOW_TARGET).addScaledVector(dir, SHADOW_DISTANCE);
  light.target.position.copy(SHADOW_TARGET);
  light.castShadow = true;
  const s = light.shadow;
  s.mapSize.set(mapSize, mapSize);
  const bounds = fitShadowBounds(dir, SHADOW_TARGET, SHADOW_DISTANCE, shadowFitPoints());
  Object.assign(s.camera, bounds);
  s.camera.updateProjectionMatrix();
  s.bias = -0.0006;
  s.normalBias = 0.05;
  s.radius = 3; // soft edge
}
