// PROTOTYPE (spike): the scroll-driven flip of the hero world. The camera rolls half a turn around its view axis, so the
// same scene turns upside down (ground overhead, sky below, petals rising), and the features menu follows.
import { Color, PerspectiveCamera, Vector3 } from "three";
import { CAMERA } from "./camera";
import { PALETTE } from "./palette";

// ---- timeline ------------------------------------------------------------------------------------------------

/** How long each part of the scroll lasts, in screen heights. */
export const STAGE = { holdVh: 0.3, flipVh: 1.3, itemVh: 0.9, items: 5 };

export interface StageState {
  /** 0 = the hero as it is .. 1 = the world turned upside down. */
  flip: number;
  /** Features shown so far, 0 .. STAGE.items (a float: 2.5 is halfway through the third). */
  feature: number;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Total height of the scroll area, in screen heights (the pinned frame itself takes one more). */
export function stageHeightVh(): number {
  return STAGE.holdVh + STAGE.flipVh + STAGE.itemVh * STAGE.items + 1;
}

/** What the scene should be showing when the stage has been scrolled `scrollVh` screen heights. */
export function stageTimeline(scrollVh: number): StageState {
  const s = Math.max(0, scrollVh);
  return {
    flip: clamp((s - STAGE.holdVh) / STAGE.flipVh),
    feature: clamp((s - STAGE.holdVh - STAGE.flipVh) / STAGE.itemVh, 0, STAGE.items),
  };
}

// ---- camera --------------------------------------------------------------------------------------------------

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where the camera looks once the world is upside down: a little higher, which leaves more sky (now below) for the menu. */
export const FLIPPED_TARGET: [number, number, number] = [-0.2, 8.5, -17];
const UP = new Vector3(0, 1, 0);

/**
 * Rolls a hero-scene camera half a turn around the way it looks, easing in and out. At flip = 0 it is exactly the hero
 * camera. `feature` slides it slowly sideways, so the near and far things drift at different speeds while the menu plays.
 */
export function applyFlip(camera: PerspectiveCamera, flip: number, feature = 0) {
  const k = ease(clamp(flip));
  const slide = feature * 0.3;
  const target = new Vector3(lerp(CAMERA.target[0], FLIPPED_TARGET[0], k) + slide, lerp(CAMERA.target[1], FLIPPED_TARGET[1], k), lerp(CAMERA.target[2], FLIPPED_TARGET[2], k));
  camera.position.set(CAMERA.position[0] + slide, CAMERA.position[1], CAMERA.position[2]);
  const forward = target.clone().sub(camera.position).normalize();
  camera.up.copy(UP).applyAxisAngle(forward, Math.PI * k);
  camera.lookAt(target);
  const fov = CAMERA.fov + 7 * Math.sin(Math.PI * k) - 2 * feature / Math.max(1, STAGE.items); // opens up mid-turn for speed, then settles
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/** Puts the camera back to plain hero use (so a stage that ends does not leave it rolled). */
export function resetFlip(camera: PerspectiveCamera) {
  camera.up.copy(UP);
  if (camera.fov !== CAMERA.fov) { camera.fov = CAMERA.fov; camera.updateProjectionMatrix(); }
}

/** Sky and fog colour: the night sky shifts toward a deep violet as the world turns over. */
export function flipSky(flip: number): Color {
  return new Color(PALETTE.sky).lerp(new Color(0x170c26), ease(clamp(flip)));
}
