export interface Env {
  webgl: boolean;
  /** WebGL exists but runs on the CPU (SwiftShader, llvmpipe, Microsoft Basic Render Driver ...): far too slow for the scene. */
  softwareRenderer: boolean;
  reducedMotion: boolean;
  width: number;
  coarsePointer: boolean;
}

/** The live scene runs only on a capable desktop browser; otherwise the still image stays. */
export function shouldRunScene(env: Env): boolean {
  return env.webgl && !env.softwareRenderer && !env.reducedMotion && !env.coarsePointer && env.width >= 768;
}

/** True for the names a browser reports for a WebGL renderer that draws on the CPU. */
export function isSoftwareRenderer(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|software|basic render driver|mesa offscreen/i.test(name);
}

export function detectEnv(win: Window): Env {
  let webgl = false, softwareRenderer = false;
  const params = new URLSearchParams(win.location.search);
  try {
    // ?3d in the URL skips the checks for slow graphics: for trying the scene on a machine that would otherwise get the picture
    const force = params.has("3d");
    // failIfMajorPerformanceCaveat: the browser refuses a context that would be software-rendered
    const attrs = { failIfMajorPerformanceCaveat: !force };
    const canvas = win.document.createElement("canvas");
    const gl = (canvas.getContext("webgl2", attrs) || canvas.getContext("webgl", attrs)) as WebGLRenderingContext | null;
    webgl = !!gl;
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    softwareRenderer = !force && !!gl && !!info && isSoftwareRenderer(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  } catch {
    webgl = false;
  }
  if (params.has("plain")) webgl = false; // ?plain in the URL shows the page as machines without 3D get it (to look at it, or to link to it)
  return {
    webgl,
    softwareRenderer,
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
const GIVE_UP_MS = 100; // slower than 10 fps at any resolution
const GIVE_UP_AT_FLOOR_MS = 60; // slower than about 16 fps although already at the lowest resolution

/** Render scale for the next period: step down 25% when the average frame is slow, never below the floor. */
export function adaptPixelRatioScale(scale: number, avgFrameMs: number): number {
  if (!Number.isFinite(avgFrameMs) || avgFrameMs <= 0) return scale;
  return avgFrameMs > SLOW_FRAME_MS ? Math.max(MIN_SCALE, scale - 0.25) : scale;
}

/**
 * Whether the scene is too slow to be worth running: the page should go back to the picture. Looks at the average frame
 * time of a period after the warm-up, and the render scale the scene has already dropped to.
 */
export function shouldGiveUp(avgFrameMs: number, scale: number): boolean {
  if (!Number.isFinite(avgFrameMs) || avgFrameMs <= 0) return false;
  return avgFrameMs > GIVE_UP_MS || (scale <= MIN_SCALE && avgFrameMs > GIVE_UP_AT_FLOOR_MS);
}
