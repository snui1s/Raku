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
