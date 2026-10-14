import { BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Float32BufferAttribute, Mesh, ShaderMaterial, Vector3 } from "three";
import { hillHeight } from "./hill";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Centerline in (x, z), from far (small z magnitude last) to near the camera. The river flows toward the viewer. */
export const RIVER = {
  points: [[-13, -44], [-10.4, -31], [-8, -22], [-4.8, -16], [-3.6, -11.6], [-5.4, -8.8], [-3.4, -6.2], [-2.0, -3.9]] as [number, number][],
  widthFar: 0.7,
  widthNear: 1.5,
};

/** River width at u = 0 (far end) .. 1 (near end). */
export const riverWidthAt = (u: number) => RIVER.widthFar + (RIVER.widthNear - RIVER.widthFar) * Math.pow(u, 1.3);

const curve = new CatmullRomCurve3(RIVER.points.map(([x, z]) => new Vector3(x, 0, z)), false, "centripetal");
const SAMPLES = 120;
const samples = Array.from({ length: SAMPLES + 1 }, (_, i) => curve.getPoint(i / SAMPLES));

/** Distance in the ground plane from (x, z) to the river centerline. */
export function riverDistance(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const abx = b.x - a.x, abz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz || 1)));
    best = Math.min(best, Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)));
  }
  return best;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// uv.x across the river, uv.y along it (0 far .. 1 near). Light streaks slide toward the viewer.
const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uBase;
  uniform vec3 uLight;
  uniform float uTime;
  void main() {
    float along = vUv.y * 150.0 - uTime * 2.2;
    float wob = sin(vUv.x * 11.0 + vUv.y * 26.0 + uTime * 0.6) * 1.4;
    float streak = smoothstep(0.78, 0.96, sin(along + wob) * 0.5 + 0.5);
    float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
    float far = smoothstep(0.0, 0.12, vUv.y);
    vec3 col = mix(uBase, uLight, streak * 0.75 + (1.0 - edge) * 0.35);
    gl_FragColor = vec4(col, (0.92 * edge + 0.08) * far);
  }
`;

export function buildRiver(palette: Palette): ScenePart {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const up = new Vector3(0, 1, 0);
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES, p = samples[i];
    const tan = curve.getTangent(u).setY(0).normalize();
    const side = new Vector3().crossVectors(up, tan).normalize(); // points to the left of the flow direction
    const half = riverWidthAt(u) / 2;
    for (const s of [-1, 1]) {
      const x = p.x + side.x * half * s, z = p.z + side.z * half * s;
      pos.push(x, hillHeight(x, z) + 0.07, z); // each edge follows the ground, so the river bends with the slope
      uv.push((s + 1) / 2, u);
    }
    if (i < SAMPLES) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new ShaderMaterial({
    uniforms: { uBase: { value: new Color(palette.water[0]) }, uLight: { value: new Color(palette.water[1]) }, uTime: { value: 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    fog: false,
  });
  const mesh = new Mesh(geo, mat);
  mesh.name = "river";
  mesh.frustumCulled = false;
  return { object: mesh, update: (t) => { mat.uniforms.uTime.value = t; } };
}
