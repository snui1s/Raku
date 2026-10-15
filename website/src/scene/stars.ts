import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, Points, ShaderMaterial } from "three";
import { cappedPixelRatio } from "./capabilities";
import { mulberry32 } from "./rng";
import type { ScenePart } from "./index";

/** Stars on a far dome in front of the camera (the visible sky window, with some margin for parallax). It reaches up to
 *  78 degrees so there are stars to look at when the feature constellation tilts the camera into the sky. */
export const STARS = {
  count: 340,
  radius: 220,
  elevationDeg: [9, 78] as [number, number],
  azimuthDeg: [-58, 58] as [number, number],
  size: [2.4, 5.8] as [number, number], // CSS pixels
};

const WHITE: [number, number, number] = [1, 1, 1];
const YELLOW: [number, number, number] = [1, 0.91, 0.6];

export function generateStars(count: number, seed = 5) {
  const rng = mulberry32(seed);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count), phases = new Float32Array(count);
  const rad = Math.PI / 180;
  for (let i = 0; i < count; i++) {
    const az = r(STARS.azimuthDeg[0], STARS.azimuthDeg[1]) * rad;
    const el = r(STARS.elevationDeg[0], STARS.elevationDeg[1]) * rad;
    positions[i * 3] = STARS.radius * Math.cos(el) * Math.sin(az);
    positions[i * 3 + 1] = STARS.radius * Math.sin(el);
    positions[i * 3 + 2] = -STARS.radius * Math.cos(el) * Math.cos(az);
    const c = rng() < 0.42 ? YELLOW : WHITE;
    colors.set(c, i * 3);
    sizes[i] = rng() < 0.12 ? r(4.4, STARS.size[1]) : r(STARS.size[0], 4.2); // a few bright ones
    phases[i] = r(0, Math.PI * 2);
  }
  return { positions, colors, sizes, phases };
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.62 + 0.38 * sin(uTime * (0.9 + fract(aPhase * 7.0)) + aPhase);
    gl_PointSize = aSize * uPixelRatio * (0.9 + 0.2 * vTwinkle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vTwinkle;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

export function buildStars(): ScenePart {
  const group = new Group();
  group.name = "stars";
  const s = generateStars(STARS.count);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(s.positions, 3));
  geo.setAttribute("aColor", new Float32BufferAttribute(s.colors, 3));
  geo.setAttribute("aSize", new Float32BufferAttribute(s.sizes, 1));
  geo.setAttribute("aPhase", new Float32BufferAttribute(s.phases, 1));
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const points = new Points(geo, mat);
  points.name = "star-points";
  points.frustumCulled = false;
  points.renderOrder = -1; // behind everything else that is transparent
  group.add(points);
  return {
    object: group,
    update: (t) => {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uPixelRatio.value = cappedPixelRatio(typeof window === "undefined" ? 1 : window.devicePixelRatio);
    },
  };
}
