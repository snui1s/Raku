// The whole home page as one scroll: hero, the feature stars, the notebook in the glade, the numbers on the tree and
// the download on the fox. Everything here is pure (no scene objects), so the timeline can be tested on its own.
import { PerspectiveCamera, Vector3 } from "three";
import { CONSTELLATION, constellationPose, constellationTimeline } from "./constellation";

/** Scroll lengths in screen heights. The hero, tilt and feature lengths come from CONSTELLATION. */
export const JOURNEY = {
  descent: 0.9, // from the stars back down to the glade
  write: 0.7, // the notebook is open and the camera holds
  toTree: 0.9, // the camera pans from the glade to the tree
  numbers: 0.6, // the numbers are shown and the camera holds
  toFox: 0.9,
  final: 0.6, // the camera holds on the fox
};

const STARS_END = CONSTELLATION.holdVh + CONSTELLATION.tiltVh + CONSTELLATION.itemVh * CONSTELLATION.stars.length;
const WRITE_END = STARS_END + JOURNEY.descent + JOURNEY.write;
const NUMBERS_START = WRITE_END + JOURNEY.toTree;
const NUMBERS_END = NUMBERS_START + JOURNEY.numbers;

/** Where each chapter starts, in screen heights of scroll (what the "Features" link and focus handling scroll to). */
export const JOURNEY_AT = {
  stars: CONSTELLATION.holdVh + CONSTELLATION.tiltVh,
  write: STARS_END + JOURNEY.descent,
  numbers: NUMBERS_START,
  fox: NUMBERS_END + JOURNEY.toFox,
};

export function journeyHeightVh(): number {
  return JOURNEY_AT.fox + JOURNEY.final + 1; // the pinned frame itself takes one more screen
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => { const k = clamp(t); return k * k * (3 - 2 * k); };
const smoothstep = (e0: number, e1: number, v: number) => smooth((v - e0) / (e1 - e0));

export interface JourneyState {
  scroll: number;
  /** The constellation part: tilt up into the sky (stays 1 afterwards) and how many features are reached. */
  tilt: number;
  feature: number;
  /** How violet the sky is: 0 = night blue .. 0.7 = deep violet while looking up. */
  skyBlend: number;
  /** How visible each chapter's content is, 0..1. */
  stars: number;
  write: number;
  numbers: number;
  tag: number;
  /** How far the camera is through each move, 0..1. */
  descent: number;
  toTree: number;
  toFox: number;
}

export function journeyAt(scrollVh: number): JourneyState {
  const s = Math.max(0, scrollVh);
  const cons = constellationTimeline(Math.min(s, STARS_END));
  const descent = clamp((s - STARS_END) / JOURNEY.descent);
  const toTree = clamp((s - WRITE_END) / JOURNEY.toTree);
  const toFox = clamp((s - NUMBERS_END) / JOURNEY.toFox);
  return {
    scroll: s,
    tilt: cons.tilt,
    feature: cons.feature,
    skyBlend: 0.7 * cons.tilt * (1 - smooth(descent)),
    stars: smoothstep(0.7, 1, cons.tilt) * (1 - smoothstep(0, 0.3, descent)),
    write: smoothstep(0.5, 1, descent) * (1 - smoothstep(0, 0.35, toTree)),
    numbers: smoothstep(0.5, 1, toTree) * (1 - smoothstep(0, 0.4, toFox)),
    tag: smoothstep(0.6, 1, toFox),
    descent,
    toTree,
    toFox,
  };
}

// ---- camera -------------------------------------------------------------------------------------------------

/** A camera: where it is, the unit direction it looks in, and the field of view. Never rolled. */
export interface Pose { position: Vector3; direction: Vector3; fov: number }

export function lookPose(position: [number, number, number], target: [number, number, number], fov: number): Pose {
  const p = new Vector3(...position);
  return { position: p, direction: new Vector3(...target).sub(p).normalize(), fov };
}

/** In the glade by the cherry tree: the notebook floats on the left, the tree fills the right. */
export const GLADE = lookPose([2.0, 3.3, -5.5], [4.6, 4.4, -16], 44);
/** Across the glade from the cherry tree, looking at the lanterns that hang from its branches. */
export const TREE_VIEW = lookPose([6.0, 4.4, -12.5], [8.1, 5.9, -19.5], 44);

const mix = (a: Pose, b: Pose, t: number): Pose => ({
  position: a.position.clone().lerp(b.position, t),
  direction: a.direction.clone().lerp(b.direction, t).normalize(),
  fov: a.fov + (b.fov - a.fov) * t,
});

/** The camera for a point in the journey. `fox` is the close-up of the fox, which the scene knows and this module does not. */
export function journeyPose(state: JourneyState, fox: Pose): Pose {
  // once the stars are done, tilt and feature stay at their end values, so this is the sky camera for the rest
  const sky = constellationPose(state.tilt, state.feature);
  const toGlade = mix(sky, GLADE, smooth(state.descent));
  const toTree = mix(toGlade, TREE_VIEW, smooth(state.toTree));
  return mix(toTree, fox, smooth(state.toFox));
}

/** True while the camera is looking up at the stars, with the whole hill (and its flowers) below the bottom of the screen. */
export function lookingAtSky(state: JourneyState): boolean {
  return state.descent === 0 && state.tilt >= 0.85;
}

/** Where points in the world are on screen, in CSS pixels, so the page can put DOM next to them. */
export function projectPoints(camera: PerspectiveCamera, width: number, height: number, points: Vector3[]) {
  camera.updateMatrixWorld(true);
  return points.map((p) => {
    const inView = p.clone().applyMatrix4(camera.matrixWorldInverse);
    const v = p.clone().project(camera);
    return {
      x: ((v.x + 1) / 2) * width,
      y: ((1 - v.y) / 2) * height,
      visible: inView.z < -0.1 && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4,
    };
  });
}

// ---- chapters ------------------------------------------------------------------------------------------------

export type Chapter = "hero" | "stars" | "write" | "numbers" | "fox";

/** Which chapter a scroll position is in (the notebook's chapter runs on until the camera has left the glade). */
export function chapterAt(scrollVh: number): Chapter {
  if (scrollVh < JOURNEY_AT.stars) return "hero";
  if (scrollVh < JOURNEY_AT.write) return "stars";
  if (scrollVh < JOURNEY_AT.numbers) return "write";
  if (scrollVh < JOURNEY_AT.fox) return "numbers";
  return "fox";
}

/** A scroll position where a chapter is fully shown: what focusing something in that chapter scrolls to. */
export function chapterScroll(chapter: Chapter): number {
  switch (chapter) {
    case "hero": return 0;
    case "stars": return JOURNEY_AT.stars + CONSTELLATION.itemVh * 0.5;
    case "write": return JOURNEY_AT.write + JOURNEY.write / 2;
    case "numbers": return JOURNEY_AT.numbers + JOURNEY.numbers / 2;
    case "fox": return JOURNEY_AT.fox + JOURNEY.final / 2; // JOURNEY_AT.fox is where the move to the fox ends
  }
}
