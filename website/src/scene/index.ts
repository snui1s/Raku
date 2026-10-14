import {
  AmbientLight, DataTexture, DirectionalLight, Fog, Color, NearestFilter, PerspectiveCamera,
  RedFormat, Scene, WebGLRenderer, Group, Vector3, type Object3D, type Texture,
} from "three";
import { CAMERA, parallaxOffset } from "./camera";
import { adaptPixelRatioScale, cappedPixelRatio } from "./capabilities";
import { PALETTE, type Palette, type Theme } from "./palette";
import { buildHill } from "./hill";
import { buildTorii } from "./torii";
import { buildTree } from "./tree";
import { buildGrass } from "./grass";
import { buildPetals } from "./petals";
import { buildStars } from "./stars";
import { buildMoon } from "./moon";
import { buildRiver } from "./river";
import { buildFox } from "./fox";
import { buildWindLines } from "./windlines";
import { buildFlowers } from "./flowers";

export interface SceneOptions {
  getTheme: () => Theme;
  /** Called when the scene cannot continue (context lost, init error); the still image stays visible. */
  onFail?: () => void;
  /** Deterministic single frame at a fixed time, no parallax and no loop (used to render stills). */
  still?: { time: number };
}

export interface ScenePart {
  object: Object3D;
  update?: (timeSec: number, dtSec: number) => void;
}

/** Builders for each piece of the world; later tasks add torii, tree, grass and petals here. */
type Builder = (palette: Palette, toon: Texture) => ScenePart | Object3D;
const BUILDERS: Builder[] = [(p) => buildStars(p), (p) => buildMoon(p), (p, toon) => buildHill(p, toon), (p) => buildRiver(p), (p, toon) => buildFox(p, toon), (p, toon) => buildTorii(p, toon), (p, toon) => buildTree(p, toon),
  (p, toon) => buildFlowers(p, toon), (p, toon) => buildGrass(p, toon), (p, toon) => buildPetals(p, toon), (p) => buildWindLines(p)];

function toonGradient(): Texture {
  const data = new Uint8Array([90, 170, 255]);
  const t = new DataTexture(data, data.length, 1, RedFormat);
  t.minFilter = t.magFilter = NearestFilter;
  t.needsUpdate = true;
  return t;
}

function disposeTree(root: Object3D) {
  root.traverse((o) => {
    const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
    m.geometry?.dispose();
    if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
    else m.material?.dispose();
  });
}

export async function mountScene(host: HTMLElement, opts: SceneOptions): Promise<{ dispose(): void }> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: false });
  const canvas = renderer.domElement;
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .6s ease";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 500);
  const toon = toonGradient();
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(-8, 14, 6);
  scene.add(new AmbientLight(0xffffff, 1.1), sun);

  let world = new Group();
  let parts: ScenePart[] = [];
  let theme: Theme = opts.getTheme();

  function rebuild() {
    scene.remove(world);
    disposeTree(world);
    world = new Group();
    parts = BUILDERS.map((b) => {
      const r = b(PALETTE[theme], toon);
      return "object" in r && !("isObject3D" in r) ? (r as ScenePart) : { object: r as Object3D };
    });
    parts.forEach((p) => world.add(p.object));
    scene.add(world);
    const pal = PALETTE[theme];
    scene.background = new Color(pal.sky);
    scene.fog = new Fog(pal.sky, 120, 420);
  }

  const target = new Vector3(...CAMERA.target);
  const pointer = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };
  function placeCamera() {
    const o = parallaxOffset(smooth);
    camera.position.set(CAMERA.position[0] + o.x, CAMERA.position[1] + o.y, CAMERA.position[2]);
    camera.lookAt(target);
  }

  let appliedDpr = 0, quality = 1;
  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    appliedDpr = window.devicePixelRatio;
    renderer.setPixelRatio(cappedPixelRatio(appliedDpr) * quality);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let failed = false;
  const fail = () => {
    if (failed) return;
    failed = true;
    dispose();
    opts.onFail?.();
  };

  // Adaptive quality: if frames stay slow, render at a lower resolution (never back up, to avoid flicker).
  let winMs = 0, winFrames = 0, windows = 0;
  function trackFrame(ms: number) {
    winMs += ms; winFrames++;
    if (winMs >= 2000) {
      windows++; // the first two windows include shader compilation, so ignore them
      if (windows > 2) {
        const next = adaptPixelRatioScale(quality, winMs / winFrames);
        if (next !== quality) { quality = next; resize(); }
      }
      if (overlay) overlay.textContent = fpsText(winMs / winFrames);
      winMs = 0; winFrames = 0;
    }
  }
  const fpsText = (avgMs: number) => {
    const i = renderer.info;
    return "fps " + Math.round(1000 / avgMs) + " | draw calls " + i.render.calls + " | triangles " + i.render.triangles + " | scale " + quality;
  };
  // ?fps in the URL shows a small readout, so the owner can report numbers from a real machine
  const overlay = !opts.still && new URLSearchParams(location.search).has("fps") ? document.createElement("div") : null;
  if (overlay) {
    overlay.style.cssText = "position:absolute;left:12px;bottom:12px;z-index:5;font:12px monospace;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;pointer-events:none";
    host.appendChild(overlay);
  }

  let raf = 0, last = 0, elapsed = 0, shown = false;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (window.devicePixelRatio !== appliedDpr) resize(); // window moved to a screen with another pixel ratio
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; // clamp so a restored tab does not jump
    last = now;
    elapsed += dt;
    if (dt > 0) trackFrame(dt * 1000);
    smooth.x += (pointer.x - smooth.x) * 0.06;
    smooth.y += (pointer.y - smooth.y) * 0.06;
    placeCamera();
    parts.forEach((p) => p.update?.(elapsed, dt));
    renderer.render(scene, camera);
    if (!shown) { shown = true; canvas.style.opacity = "1"; }
  }
  const start = () => { if (!raf && !failed) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  let inView = true;
  const sync = () => (inView && !document.hidden ? start() : stop());
  const io = new IntersectionObserver((e) => { inView = e[e.length - 1].isIntersecting; sync(); });
  const onVis = () => sync();
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const ro = new ResizeObserver(resize);
  const themeObs = new MutationObserver(() => {
    const next = opts.getTheme();
    if (next !== theme) { theme = next; rebuild(); }
  });
  const onLost = (e: Event) => { e.preventDefault(); fail(); };

  function dispose() {
    stop();
    io.disconnect(); ro.disconnect(); themeObs.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("webglcontextlost", onLost);
    disposeTree(world);
    toon.dispose();
    renderer.dispose();
    overlay?.remove();
    canvas.remove();
  }

  try {
    canvas.addEventListener("webglcontextlost", onLost);
    rebuild();
    resize();
    if (opts.still) {
      placeCamera();
      parts.forEach((p) => p.update?.(opts.still!.time, 0));
      renderer.render(scene, camera);
      canvas.style.transition = "none";
      canvas.style.opacity = "1";
    } else {
      ro.observe(host);
      io.observe(host);
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("pointermove", onMove, { passive: true });
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      sync();
    }
  } catch {
    fail();
  }
  return { dispose };
}
