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

/** Centre point of the river at u (0 far .. 1 near), and the horizontal unit vector pointing to the left of the flow. */
export function riverFrame(u: number): { point: Vector3; side: Vector3 } {
  const tan = curve.getTangent(u).setY(0).normalize();
  return { point: curve.getPoint(u), side: new Vector3().crossVectors(new Vector3(0, 1, 0), tan).normalize() };
}

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
// One surface, four analytic waves: flowing ribbons, a broken moon reflection and a soft shallow-water edge.
const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uBase;
  uniform vec3 uLight;
  uniform vec3 uGlint;
  uniform float uTime;
  void main() {
    float x = vUv.x * 2.0 - 1.0;
    float flow = vUv.y * 105.0 - uTime * 1.6;
    float bend = sin(vUv.y * 23.0 - uTime * 0.25);
    float crossWave = sin(vUv.y * 44.0 + x * 7.0 + uTime * 0.5);
    float ripple = sin(flow + x * 4.0 + bend * 1.3);
    float shimmer = sin(flow * 1.73 - x * 13.0 + bend);
    float aa = max(fwidth(flow), 0.035);
    float detail = 1.0 - smoothstep(0.7, 2.5, aa);
    float crest = smoothstep(0.84 - aa * 0.12, 0.98, ripple) * (0.35 + 0.65 * detail);
    float lane = 1.0 - smoothstep(0.09, 0.4, abs(vUv.x - (0.48 + 0.12 * bend + 0.045 * crossWave)));
    float edge = smoothstep(0.0, 0.075, vUv.x) * (1.0 - smoothstep(0.925, 1.0, vUv.x));
    float far = smoothstep(0.0, 0.12, vUv.y);
    vec3 col = uBase * (0.72 + x * x * 0.36);
    col = mix(col, uLight, 0.08 + lane * 0.12 + (crossWave * 0.5 + 0.5) * 0.06);
    col = mix(col, uLight, crest * (0.18 + lane * 0.36));
    float glint = smoothstep(0.95, 0.999, shimmer)
      * (1.0 - smoothstep(0.04, 0.12, abs(x * 0.5 - crossWave * 0.15))) * detail * edge;
    float bank = (1.0 - smoothstep(0.025, 0.09, min(vUv.x, 1.0 - vUv.x)))
      * smoothstep(0.15, 0.75, crossWave) * 0.18;
    col = mix(col, uGlint, glint * 0.65 + bank);
    gl_FragColor = vec4(col, (0.92 * edge + 0.08) * far);
    #include <colorspace_fragment>
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
    uniforms: {
      uBase: { value: new Color(palette.water[0]).lerp(new Color(0x17475e), 0.45) },
      uLight: { value: new Color(palette.water[1]).lerp(new Color(0x66c3c4), 0.35) },
      uGlint: { value: new Color(0xe5f1e9) }, uTime: { value: 0 },
    },
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
