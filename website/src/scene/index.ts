import {
  AmbientLight, DataTexture, DirectionalLight, Fog, Color, NearestFilter, PCFShadowMap, PerspectiveCamera,
  RedFormat, Scene, WebGLRenderer, Group, Vector3, type Object3D, type Texture,
} from "three";
import { CAMERA, parallaxOffset } from "./camera";
import { adaptPixelRatioScale, cappedPixelRatio } from "./capabilities";
import { PALETTE, type Palette } from "./palette";
import { disposeTree } from "./dispose";
import { buildHill } from "./hill";
import { buildTorii } from "./torii";
import { buildTree } from "./tree";
import { buildGrass } from "./grass";
import { buildPetals } from "./petals";
import { buildStars } from "./stars";
import { buildMoon } from "./moon";
import { buildClouds } from "./clouds";
import { buildRiver } from "./river";
import { buildRiverside } from "./riverside";
import { buildFox } from "./fox";
import { buildWindLines } from "./windlines";
import { buildFlowers } from "./flowers";
import { LIGHTING, SUN_POSITION, configureMoonLight } from "./shadows";
import { applyFlip, flipSky, resetFlip, type StageState } from "./stage";
import { buildWhirl, createHorizonFlash } from "./vortex";
import { applyConstellationCamera, buildConstellation, projectStars, type ConstellationState } from "./constellation";

export interface SceneOptions {
  /** Called when the scene cannot continue (context lost, init error); the still image stays visible. */
  onFail?: () => void;
  /** Deterministic single frame at a fixed time, no parallax and no loop (used to render stills). */
  still?: { time: number };
  /** PROTOTYPE: scroll-driven flip of the world, read once per frame. */
  stage?: { getState: () => StageState };
  /** Features as a constellation: the camera tilts up into the sky and a star lights for each feature. */
  constellation?: {
    getState: () => ConstellationState;
    /** Called every frame with the on-screen position (CSS pixels) of each feature star, for the page's labels. */
    onProject?: (stars: ReturnType<typeof projectStars>) => void;
  };
}

export interface ScenePart {
  object: Object3D;
  update?: (timeSec: number, dtSec: number) => void;
}

/** Builders for each piece of the world; later tasks add torii, tree, grass and petals here. */
type Builder = (palette: Palette, toon: Texture) => ScenePart | Object3D;
/** What each piece does with the moon's shadow map: casts a shadow, receives one, or neither. */
interface Entry { build: Builder; cast?: boolean; receive?: boolean }
const BUILDERS: Entry[] = [
  { build: () => buildStars() }, { build: (p) => buildMoon(p) }, { build: (p) => buildClouds(p) },
  { build: (p, toon) => buildHill(p, toon) }, // the hill marks its own near mesh as a receiver
  { build: (p) => buildRiver(p) },
  { build: (p, toon) => buildRiverside(p, toon) }, // marks its own stones as casters and receivers
  { build: (p, toon) => buildFox(p, toon), cast: true, receive: true },
  { build: (p, toon) => buildTorii(p, toon), cast: true, receive: true },
  { build: (p, toon) => buildTree(p, toon), cast: true, receive: true },
  { build: (p, toon) => buildFlowers(p, toon), receive: true },
  { build: (p, toon) => buildGrass(p, toon), receive: true },
  { build: (p, toon) => buildPetals(p, toon) }, { build: () => buildWindLines() },
];

function toonGradient(): Texture {
  const data = new Uint8Array([90, 170, 255]);
  const t = new DataTexture(data, data.length, 1, RedFormat);
  t.minFilter = t.magFilter = NearestFilter;
  t.needsUpdate = true;
  return t;
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
  const sun = new DirectionalLight(0xffffff, LIGHTING.sun);
  sun.position.set(...SUN_POSITION);
  // The moon's light casts the shadows. The shadow map is drawn once per build, not every frame: what casts shadows
  // barely moves, and this keeps the per-frame cost to reading the map.
  const moonLight = new DirectionalLight(0xffffff, LIGHTING.moon);
  configureMoonLight(moonLight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  scene.add(new AmbientLight(0xffffff, LIGHTING.ambient), sun, moonLight, moonLight.target);

  let world = new Group();
  let parts: ScenePart[] = [];
  // stage only: petals that whirl round the view while the world turns, and a glow along the horizon
  const whirl = opts.stage ? buildWhirl(PALETTE) : null;
  const flash = opts.stage ? createHorizonFlash() : null;
  if (whirl) { scene.add(camera); camera.add(whirl.object); }

  function rebuild() {
    scene.remove(world);
    disposeTree(world);
    world = new Group();
    parts = BUILDERS.map((entry) => {
      const r = entry.build(PALETTE, toon);
      const part = "object" in r && !("isObject3D" in r) ? (r as ScenePart) : { object: r as Object3D };
      part.object.traverse((o) => {
        if (entry.cast) o.castShadow = true;
        if (entry.receive) o.receiveShadow = true;
      });
      return part;
    });
    if (opts.constellation) parts.push(buildConstellation(() => opts.constellation!.getState().feature));
    parts.forEach((p) => world.add(p.object));
    scene.add(world);
    scene.background = new Color(PALETTE.sky);
    scene.fog = new Fog(PALETTE.sky, 120, 420);
    renderer.shadowMap.needsUpdate = true; // draw the shadow map once for this build
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
    const stage = opts.stage?.getState();
    const cons = opts.constellation?.getState();
    if (cons && cons.tilt > 0) {
      applyConstellationCamera(camera, cons.tilt, cons.feature);
      const sky = flipSky(cons.tilt * 0.7); // the night sky deepens toward violet while we look up
      (scene.background as Color).copy(sky);
      (scene.fog as Fog).color.copy(sky);
    } else if (stage && (stage.flip > 0 || stage.feature > 0)) {
      applyFlip(camera, stage.flip, stage.feature);
      const sky = flipSky(stage.flip);
      (scene.background as Color).copy(sky);
      (scene.fog as Fog).color.copy(sky);
    } else {
      smooth.x += (pointer.x - smooth.x) * 0.06;
      smooth.y += (pointer.y - smooth.y) * 0.06;
      if (stage || cons) { resetFlip(camera); (scene.background as Color).set(PALETTE.sky); (scene.fog as Fog).color.set(PALETTE.sky); }
      placeCamera();
    }
    parts.forEach((p) => p.update?.(elapsed, dt));
    if (cons && opts.constellation?.onProject) {
      camera.updateMatrixWorld(true);
      opts.constellation.onProject(projectStars(camera, host.clientWidth, host.clientHeight));
    }
    if (stage && whirl) whirl.update(elapsed, stage.flip, camera.fov, camera.aspect);
    renderer.render(scene, camera);
    if (stage && flash && flash.set(camera, stage.flip, elapsed)) flash.draw(renderer);
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
  const onLost = (e: Event) => { e.preventDefault(); fail(); };

  function dispose() {
    stop();
    io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("webglcontextlost", onLost);
    disposeTree(world);
    whirl?.dispose();
    flash?.dispose();
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
      sync();
    }
  } catch {
    fail();
  }
  return { dispose };
}
