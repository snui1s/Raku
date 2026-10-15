import { BackSide, Color, Group, Mesh, ShaderMaterial, SphereGeometry } from "three";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Where the sky goes when the world turns over or the camera looks up into the stars: a deep violet. */
export const SKY_VIOLET = { horizon: 0x3a2a78, zenith: 0x12082e, fog: 0x2a1c5c };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Lighter at the horizon, darker overhead, with a faint glow along the horizon line and a little noise against banding.
const FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  void main() {
    float h = normalize(vDir).y;
    float t = smoothstep(-0.05, 0.9, h);
    vec3 col = mix(uHorizon, uZenith, pow(t, 0.75));
    col += uHorizon * 0.15 * exp(-abs(h) * 9.0);
    col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/** The night sky: a big inside-out dome shaded from a lighter blue at the horizon to a deep blue overhead. */
export function buildSky(palette: Palette): ScenePart & { setBlend(k: number): void; fogColor(): Color } {
  const horizon = new Color(palette.skyHorizon), zenith = new Color(palette.skyZenith);
  const material = new ShaderMaterial({
    uniforms: { uHorizon: { value: horizon.clone() }, uZenith: { value: zenith.clone() } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new Mesh(new SphereGeometry(450, 32, 16), material);
  dome.name = "sky-dome";
  dome.renderOrder = -100;
  dome.frustumCulled = false;
  const group = new Group();
  group.add(dome);

  let blend = 0;
  return {
    object: group,
    setBlend(k: number) {
      blend = clamp(k);
      material.uniforms.uHorizon.value.copy(horizon).lerp(new Color(SKY_VIOLET.horizon), blend);
      material.uniforms.uZenith.value.copy(zenith).lerp(new Color(SKY_VIOLET.zenith), blend);
    },
    fogColor() {
      return new Color(palette.sky).lerp(new Color(SKY_VIOLET.fog), blend);
    },
  };
}
