export interface Env {
  webgl: boolean;
  reducedMotion: boolean;
  width: number;
  coarsePointer: boolean;
}

/** The live scene runs only on a capable desktop browser; otherwise the still image stays. */
export function shouldRunScene(env: Env): boolean {
  return env.webgl && !env.reducedMotion && !env.coarsePointer && env.width >= 768;
}

export function detectEnv(win: Window): Env {
  let webgl = false;
  try {
    const canvas = win.document.createElement("canvas");
    webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  return {
    webgl,
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    width: win.innerWidth,
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
  };
}

/** Pixel ratio the renderer should use: the screen's ratio, capped at 2 to bound GPU work. */
export function cappedPixelRatio(dpr: number | undefined): number {
  return dpr && Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 2) : 1;
}

const SLOW_FRAME_MS = 26; // slower than about 38 fps
const MIN_SCALE = 0.6;

/** Render scale for the next period: step down 25% when the average frame is slow, never below the floor. */
export function adaptPixelRatioScale(scale: number, avgFrameMs: number): number {
  if (!Number.isFinite(avgFrameMs) || avgFrameMs <= 0) return scale;
  return avgFrameMs > SLOW_FRAME_MS ? Math.max(MIN_SCALE, scale - 0.25) : scale;
}
