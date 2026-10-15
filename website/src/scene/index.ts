import {
  AmbientLight, DataTexture, DirectionalLight, Fog, Color, NearestFilter, PCFShadowMap, PerspectiveCamera,
  RedFormat, Raycaster, Scene, WebGLRenderer, Group, Vector2, Vector3, type Object3D, type Texture,
} from "three";
import { CAMERA, journeyParallax, parallaxOffset } from "./camera";
import { adaptPixelRatioScale, cappedPixelRatio, shouldGiveUp } from "./capabilities";
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
import { buildSky } from "./sky";
import { CONSTELLATION, buildConstellation, projectStars } from "./constellation";
import { journeyPose, lookingAtSky, projectPoints, type JourneyState } from "./journey";
import { FOX_TAG, foxCamera, foxLocalToWorld } from "./fox";
import { BLOSSOM, treeLocalToWorld } from "./tree";
import { buildShootingStars } from "./shootingstar";
import { starPositions } from "./stars";
import { activateSceneHit, classifyHit, createSceneTap, nearestPoint, pointerWind, type SceneHit } from "./interact";
import { decayWind, pushWind } from "./wind";
import { buildLanterns } from "./lanterns";

export interface SceneOptions {
  /** Called when the scene cannot continue (context lost, init error); the still image stays visible. */
  onFail?: () => void;
  /** Deterministic single frame at a fixed time, no parallax and no loop (used to render stills). */
  still?: { time: number };
  /** The whole home page as one scroll: the camera, the feature stars, the lanterns and the fox tag follow the scroll. */
  journey?: {
    getState: () => JourneyState;
    /** Called every frame with the on-screen positions (CSS pixels) the page's DOM is placed at. */
    onProject?: (p: JourneyProjection) => void;
  };
}

export interface JourneyProjection {
  stars: ReturnType<typeof projectStars>;
  /** The point just under each lantern, where its number goes. */
  lanterns: ReturnType<typeof projectPoints>;
  /** The fox's tag: its centre, its width on screen and whether it is in view. */
  tag: { x: number; y: number; width: number; visible: boolean };
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
  { build: () => buildLanterns() }, // they hang in the tree from the start; the numbers chapter zooms in on them
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
  /** The pieces the visitor can touch: found by name among the built parts after every rebuild. */
  let fox: (ScenePart & { react(): void; look(t: Vector3 | null): void }) | undefined;
  let tree: (ScenePart & { shake(): void }) | undefined;
  let lanterns: ReturnType<typeof buildLanterns> | undefined;
  let petals: (ScenePart & { burst(origin: Vector3, amount?: number): void }) | undefined;
  let shooting: (ScenePart & { shoot(from: Vector3): void }) | undefined;
  let obstacles: Object3D[] = [];
  let flowers: Object3D | undefined; // not drawn while the camera is looking up at the stars: it is the heaviest part of the scene

  let sky = buildSky(PALETTE);
  /** Tints the sky dome (0 = night blue, 1 = deep violet) and keeps the fog the same color as the horizon. */
  function tintSky(k: number) {
    sky.setBlend(k);
    (scene.background as Color).copy(sky.fogColor());
    (scene.fog as Fog).color.copy(sky.fogColor());
  }

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
    sky = buildSky(PALETTE);
    parts.push(sky);
    if (!opts.still) parts.push((shooting = buildShootingStars()));
    const named = (name: string) => parts.find((p) => p.object.name === name);
    fox = named("fox") as unknown as typeof fox;
    tree = named("tree") as unknown as typeof tree;
    lanterns = named("lanterns") as typeof lanterns;
    petals = named("petals") as unknown as typeof petals;
    flowers = named("flowers")?.object;
    obstacles = ["fox", "tree", "torii", "hill"].map((n) => named(n)?.object).filter((o): o is Object3D => !!o);
    if (opts.journey) parts.push(buildConstellation(() => opts.journey!.getState().feature));
    parts.forEach((p) => world.add(p.object));
    scene.add(world);
    // Keep each cord tied to its branch as the trunk rocks, preserving its world placement at rest.
    if (tree && lanterns) tree.object.attach(lanterns.object);
    scene.background = new Color(PALETTE.sky);
    scene.fog = new Fog(PALETTE.sky, 120, 420);
    renderer.shadowMap.needsUpdate = true; // draw the shadow map once for this build
  }

  const foxPose = foxCamera();

  // ---- touching the scene: what is under the pointer, and what a click does ----
  const raycaster = new Raycaster(), ndc = new Vector2();
  const starPoints = starPositions();
  const tap = createSceneTap();
  /** What is under a screen position: the fox, the tree, a star in the open sky, or nothing. The hill and the gate
   *  count as in front of the stars, so a star behind them cannot be clicked. */
  function pick(clientX: number, clientY: number): SceneHit | null {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    if (px < 0 || py < 0 || px > rect.width || py > rect.height || rect.width === 0) return null;
    ndc.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(obstacles, true)[0];
    const kind = classifyHit(hit?.object ?? null);
    if (kind === "fox") return { kind };
    if (kind === "tree") return { kind, point: hit.point.clone() };
    if (kind === "other") return null;
    const i = nearestPoint(projectPoints(camera, rect.width, rect.height, starPoints), px, py, 20);
    return i >= 0 ? { kind: "star", index: i } : null;
  }
  function onDown(e: PointerEvent) {
    if (e.button !== 0 || !e.isPrimary) { tap.cancel(); return; }
    tap.begin(e.pointerId, e.clientX, e.clientY, pick(e.clientX, e.clientY));
  }
  function onUp(e: PointerEvent) {
    if (e.button !== 0 || !e.isPrimary) return;
    const hit = tap.end(e.pointerId, e.clientX, e.clientY, e.target === canvas ? pick(e.clientX, e.clientY) : null);
    if (!hit) return;
    activateSceneHit(hit, { fox, tree, petals, shooting, blossom: treeLocalToWorld(BLOSSOM.local), stars: starPoints });
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
        const avg = winMs / winFrames;
        if (!opts.still && shouldGiveUp(avg, quality)) { fail(); return; } // far too slow: the page goes back to the picture
        const next = adaptPixelRatioScale(quality, avg);
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
    const frameMs = last ? Math.min(1000, now - last) : 0; // the real time of the frame, for judging speed
    last = now;
    elapsed += dt;
    if (frameMs > 0) trackFrame(frameMs);
    if (failed) return; // gave up just now: everything is disposed
    smooth.x += (pointer.x - smooth.x) * 0.06;
    smooth.y += (pointer.y - smooth.y) * 0.06;
    decayWind(dt); // the breeze from the pointer fades by itself
    const journey = opts.journey?.getState();
    if (journey && journey.scroll > CONSTELLATION.holdVh) {
      // the camera follows the pointer a little in every chapter, as it does in the hero: it moves with the pointer
      // but keeps looking at the same far point, so near things shift more than far ones
      const pose = journeyPose(journey, foxPose);
      const o = journeyParallax(smooth, journey.tag);
      camera.position.set(pose.position.x + o.x, pose.position.y + o.y, pose.position.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(pose.position.clone().addScaledVector(pose.direction, 17));
      if (camera.fov !== pose.fov) { camera.fov = pose.fov; camera.updateProjectionMatrix(); }
      tintSky(journey.skyBlend); // the night sky deepens toward violet while we look up
    } else {
      if (journey) { // back at the hero: the camera as the still has it
        camera.up.set(0, 1, 0);
        if (camera.fov !== CAMERA.fov) { camera.fov = CAMERA.fov; camera.updateProjectionMatrix(); }
        tintSky(0);
      }
      placeCamera();
    }
    if (fox) {
      // the fox looks at the pointer while it is moving, and straight ahead again a few seconds after it stops
      const rect = canvas.getBoundingClientRect();
      if (look.seen && now - look.seen < 4000 && rect.width > 0) {
        ndc.set(((look.x - rect.left) / rect.width) * 2 - 1, -((look.y - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const head = foxLocalToWorld([0.3, 0.84, 0]);
        fox.look(raycaster.ray.at(camera.position.distanceTo(head), new Vector3()));
      } else fox.look(null);
    }
    if (flowers) flowers.visible = !(journey && lookingAtSky(journey));
    parts.forEach((p) => p.update?.(elapsed, dt));
    if (journey && opts.journey?.onProject) {
      camera.updateMatrixWorld(true);
      const w = host.clientWidth, h = host.clientHeight;
      const [centre, left, right] = projectPoints(camera, w, h, [
        foxLocalToWorld(FOX_TAG.local),
        foxLocalToWorld([FOX_TAG.local[0], FOX_TAG.local[1], -FOX_TAG.halfWidth]),
        foxLocalToWorld([FOX_TAG.local[0], FOX_TAG.local[1], FOX_TAG.halfWidth]),
      ]);
      opts.journey.onProject({
        stars: projectStars(camera, w, h),
        lanterns: projectPoints(camera, w, h, lanterns?.centres().map((p) => p.setY(p.y - 0.8)) ?? []),
        tag: { x: centre.x, y: centre.y, width: Math.abs(right.x - left.x), visible: centre.visible },
      });
    }
    renderer.render(scene, camera);
    if (!shown) { shown = true; canvas.style.opacity = "1"; }
  }
  const start = () => { if (!raf && !failed) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  let inView = true;
  const sync = () => (inView && !document.hidden ? start() : stop());
  const io = new IntersectionObserver((e) => { inView = e[e.length - 1].isIntersecting; sync(); });
  const onVis = () => { tap.cancel(); sync(); };
  const look = { x: 0, y: 0, seen: 0 }; // the pointer's last position and when it last moved (same clock as the frame time)
  let hoverAt = 0;
  const onMove = (e: PointerEvent) => {
    tap.move(e.pointerId, e.clientX, e.clientY);
    if (!e.isPrimary) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    const now = performance.now();
    if (e.target === canvas && e.buttons === 0 && look.seen) pushWind(pointerWind(Math.hypot(e.clientX - look.x, e.clientY - look.y), now - look.seen));
    look.x = e.clientX; look.y = e.clientY; look.seen = now;
    if (now - hoverAt > 80) { // a pointing hand over what can be clicked
      hoverAt = now;
      canvas.style.cursor = pick(e.clientX, e.clientY) ? "pointer" : "";
    }
  };
  const onLeave = () => { tap.cancel(); look.seen = 0; canvas.style.cursor = ""; };
  const ro = new ResizeObserver(resize);
  const onLost = (e: Event) => { e.preventDefault(); fail(); };

  function dispose() {
    stop();
    io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", tap.cancel);
    window.removeEventListener("scroll", tap.cancel, true);
    window.removeEventListener("blur", onLeave);
    decayWind(100); // no wind is left over for the next scene
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
      document.documentElement.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", tap.cancel);
      window.addEventListener("scroll", tap.cancel, { capture: true, passive: true });
      window.addEventListener("blur", onLeave);
      sync();
    }
  } catch {
    fail();
  }
  return { dispose };
}
