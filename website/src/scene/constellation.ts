// The feature list as a constellation: scrolling tilts the camera up into the night sky, and each feature is a star.
import {
  AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3,
  type PerspectiveCamera,
} from "three";
import { CAMERA } from "./camera";
import type { ScenePart } from "./index";

export const CONSTELLATION = {
  /** Scroll lengths, in screen heights: the hero holds, the camera tilts up, then one stretch per feature. */
  holdVh: 0.2,
  tiltVh: 0.9,
  itemVh: 0.6,
  radius: 214, // on the star dome (a little in front of it)
  /** The feature stars as [azimuth, elevation] in degrees, a zigzag from left to right. */
  stars: [[-24, 44], [-14, 58], [2, 49], [12, 62], [17, 48]] as [number, number][],
  center: [-3, 40] as [number, number], // where the camera looks at full tilt, before it leans toward the current star
};

const RAD = Math.PI / 180;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (e0: number, e1: number, v: number) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Same convention as the star dome: x right, y up, the camera looks down -z. */
function direction(az: number, el: number, radius = 1): Vector3 {
  return new Vector3(Math.cos(el * RAD) * Math.sin(az * RAD), Math.sin(el * RAD), -Math.cos(el * RAD) * Math.cos(az * RAD)).multiplyScalar(radius);
}

export const starDirection = (i: number) => direction(CONSTELLATION.stars[i][0], CONSTELLATION.stars[i][1], CONSTELLATION.radius);

// ---- timeline -----------------------------------------------------------------------------------------------

export interface ConstellationState {
  /** 0 = the hero as it is .. 1 = the camera is looking up into the sky. */
  tilt: number;
  /** Features reached so far, 0 .. number of stars (a float: 2.5 is halfway through the third). */
  feature: number;
}

/** Total height of the scroll area in screen heights (the pinned frame itself takes one more). */
export function constellationHeightVh(): number {
  return CONSTELLATION.holdVh + CONSTELLATION.tiltVh + CONSTELLATION.itemVh * CONSTELLATION.stars.length + 1;
}

export function constellationTimeline(scrollVh: number): ConstellationState {
  const s = Math.max(0, scrollVh);
  return {
    tilt: clamp((s - CONSTELLATION.holdVh) / CONSTELLATION.tiltVh),
    feature: clamp((s - CONSTELLATION.holdVh - CONSTELLATION.tiltVh) / CONSTELLATION.itemVh, 0, CONSTELLATION.stars.length),
  };
}

// ---- camera -------------------------------------------------------------------------------------------------

/** Where the camera looks when it is up in the sky: the middle of the sky, leaning halfway toward the current star. */
function focusDirection(feature: number): Vector3 {
  const last = CONSTELLATION.stars.length - 1;
  const f = clamp(feature - 0.5, 0, last); // star i is the current one when feature = i + 0.5
  const i = Math.floor(f), s = smoothstep(0, 1, f - i);
  const a = direction(...CONSTELLATION.stars[i]), b = direction(...CONSTELLATION.stars[Math.min(i + 1, last)]);
  const star = a.multiplyScalar(1 - s).add(b.multiplyScalar(s)).normalize();
  return direction(...CONSTELLATION.center).multiplyScalar(0.5).add(star.multiplyScalar(0.5)).normalize();
}

/** Tilts the hero camera up toward the sky. At tilt 0 it is exactly the hero camera; it is never rolled. */
export function applyConstellationCamera(camera: PerspectiveCamera, tilt: number, feature: number) {
  const k = ease(clamp(tilt));
  const pos = new Vector3(...CAMERA.position);
  const hero = new Vector3(...CAMERA.target).sub(pos).normalize();
  const dir = hero.multiplyScalar(1 - k).add(focusDirection(feature).multiplyScalar(k)).normalize();
  camera.position.copy(pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(pos.clone().addScaledVector(dir, 100));
  const fov = CAMERA.fov - 4 * k; // a touch closer while looking at the stars
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/** Where each feature star is on screen, in CSS pixels, so the page can put a label next to it. */
export function projectStars(camera: PerspectiveCamera, width: number, height: number) {
  const forward = camera.getWorldDirection(new Vector3());
  return CONSTELLATION.stars.map((_, i) => {
    const dir = starDirection(i);
    const v = dir.clone().project(camera);
    const inFront = forward.dot(dir.clone().normalize()) > 0.1;
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: inFront && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4 };
  });
}

// ---- the stars and the lines between them ------------------------------------------------------------------------

const QUAD_VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
// a bright core, a soft halo and four thin spikes
const STAR_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uGlow;
  uniform float uTime;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p);
    float core = smoothstep(0.07, 0.0, d);
    float halo = pow(max(0.0, 1.0 - d * 2.0), 2.6);
    float spikes = (exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 7.0) + exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 7.0)) * 0.7;
    float twinkle = 0.9 + 0.1 * sin(uTime * 2.1);
    float a = (core + halo * 0.7 + spikes) * uGlow * twinkle;
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.78) * a, a);
  }
`;
const LINE_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uReveal;
  void main() {
    float drawn = smoothstep(uReveal, uReveal - 0.06, vUv.x) * step(0.001, uReveal);
    float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float a = (pow(across, 4.0) * 0.9 + across * 0.12) * drawn * 0.85;
    gl_FragColor = vec4(vec3(1.0, 0.93, 0.7) * a, a);
  }
`;

/** A thin strip along the great circle from a to b, trimmed at both ends so it stops short of the stars. */
function ribbon(a: Vector3, b: Vector3, trimDeg: number, halfWidth: number): BufferGeometry {
  const ua = a.clone().normalize(), ub = b.clone().normalize();
  const angle = ua.angleTo(ub), trim = (trimDeg * RAD) / angle;
  const N = 24, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const at = (t: number) =>
    ua.clone().multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle)).add(ub.clone().multiplyScalar(Math.sin(t * angle) / Math.sin(angle)));
  for (let i = 0; i <= N; i++) {
    const t = trim + (1 - 2 * trim) * (i / N);
    const p = at(t), tangent = at(Math.min(1, t + 0.01)).sub(p).normalize();
    const side = new Vector3().crossVectors(tangent, p).normalize().multiplyScalar(halfWidth * CONSTELLATION.radius);
    const c = p.clone().multiplyScalar(CONSTELLATION.radius);
    pos.push(c.x - side.x, c.y - side.y, c.z - side.z, c.x + side.x, c.y + side.y, c.z + side.z);
    uv.push(i / N, 0, i / N, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** One bright star per feature, joined by lines that draw themselves as the features are passed. */
export function buildConstellation(getFeature: () => number): ScenePart & { object: Group } {
  const group = new Group();
  group.name = "constellation";
  const starSize = 2 * CONSTELLATION.radius * Math.tan(3.4 * RAD);
  const common = { transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false };

  const stars = CONSTELLATION.stars.map((_, i) => {
    const mat = new ShaderMaterial({ uniforms: { uGlow: { value: 0.25 }, uTime: { value: 0 } }, vertexShader: QUAD_VERT, fragmentShader: STAR_FRAG, ...common });
    const mesh = new Mesh(new PlaneGeometry(starSize, starSize), mat);
    mesh.name = `feature-star-${i}`;
    mesh.position.copy(starDirection(i));
    mesh.lookAt(0, 0, 0);
    mesh.renderOrder = 5;
    group.add(mesh);
    return mat;
  });
  const lines = CONSTELLATION.stars.slice(0, -1).map((_, i) => {
    const mat = new ShaderMaterial({ uniforms: { uReveal: { value: 0 } }, vertexShader: QUAD_VERT, fragmentShader: LINE_FRAG, side: DoubleSide, ...common });
    const mesh = new Mesh(ribbon(starDirection(i), starDirection(i + 1), 3, Math.tan(0.28 * RAD)), mat);
    mesh.name = `feature-line-${i}`;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    group.add(mesh);
    return mat;
  });

  return {
    object: group,
    update: (t) => {
      const f = getFeature();
      const current = f - 0.5; // star i is the current one when feature = i + 0.5
      stars.forEach((m, i) => {
        const near = smoothstep(1, 0, Math.abs(current - i));
        m.uniforms.uGlow.value = Math.max(current > i ? 0.55 : 0.25, near);
        m.uniforms.uTime.value = t + i;
      });
      lines.forEach((m, i) => { m.uniforms.uReveal.value = clamp((f - i - 0.4) / 0.6); });
    },
  };
}
