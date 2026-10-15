/** Low camera at the foot of the hill, looking up at the gate (same idea as mockups/landing-hero.html). */
export const CAMERA = {
  fov: 44,
  position: [0, 0, 0] as [number, number, number],
  target: [-0.2, 5.0, -17] as [number, number, number],
};

const MAX_PARALLAX = 0.35;
const clamp = (v: number) => Math.max(-MAX_PARALLAX, Math.min(MAX_PARALLAX, v));

/** Pointer position in -1..1 on both axes -> small camera shift in world units. */
export function parallaxOffset(pointer: { x: number; y: number }): { x: number; y: number } {
  return { x: clamp(pointer.x * MAX_PARALLAX), y: clamp(pointer.y * MAX_PARALLAX) };
}

/** The parallax shift while scrolling through the journey. It is the full amount until the fox close-up, where the
 *  camera is only a couple of meters away and the same shift would swing the picture around (`closeUp` is 0..1). */
export function journeyParallax(pointer: { x: number; y: number }, closeUp: number): { x: number; y: number } {
  const o = parallaxOffset(pointer), k = 1 - 0.65 * Math.min(1, Math.max(0, closeUp));
  return { x: o.x * k, y: o.y * k };
}
