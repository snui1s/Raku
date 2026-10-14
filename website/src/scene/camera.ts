/** Low camera at the foot of the hill, looking up at the gate (same idea as mockups/landing-hero.html). */
export const CAMERA = {
  fov: 44,
  position: [0, 0, 0] as [number, number, number],
  target: [-0.9, 3.9, -17] as [number, number, number],
};

const MAX_PARALLAX = 0.35;
const clamp = (v: number) => Math.max(-MAX_PARALLAX, Math.min(MAX_PARALLAX, v));

/** Pointer position in -1..1 on both axes -> small camera shift in world units. */
export function parallaxOffset(pointer: { x: number; y: number }): { x: number; y: number } {
  return { x: clamp(pointer.x * MAX_PARALLAX), y: clamp(pointer.y * MAX_PARALLAX) };
}
