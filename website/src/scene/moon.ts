import { Color, Group, Mesh, PlaneGeometry, ShaderMaterial } from "three";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** The moon sits on a far dome, up and to the left of the headline. */
export const MOON = { azimuthDeg: -16, elevationDeg: 31, distance: 210, angularRadiusDeg: 3.4 };

/** World radius of the disc itself (the quad around it also carries the glow). */
export const MOON_RADIUS = MOON.distance * Math.tan((MOON.angularRadiusDeg * Math.PI) / 180);

const QUAD_RADII = 3.5; // the quad reaches this many disc radii from the centre, where the glow has faded to nothing

// craters as [x, y, radius] in disc radii
const CRATERS = [[-0.32, 0.28, 0.2], [0.3, -0.12, 0.14], [-0.05, -0.4, 0.11], [0.12, 0.42, 0.08]];

/**
 * Glow, disc and craters are drawn by one fragment shader on a single quad. Separate meshes lying in the
 * same plane fight over depth at this distance and leave stray lines, so there is only one layer.
 */
export function buildMoon(palette: Palette): ScenePart {
  const group = new Group();
  group.name = "moon";
  const rad = Math.PI / 180;
  const el = MOON.elevationDeg * rad, az = MOON.azimuthDeg * rad;
  group.position.set(
    MOON.distance * Math.cos(el) * Math.sin(az),
    MOON.distance * Math.sin(el),
    -MOON.distance * Math.cos(el) * Math.cos(az),
  );
  group.lookAt(0, 0, 0); // face the camera

  const glowStrength = 0.5;
  const craterColor = new Color(0xf0e2b8);
  const craterUniform = CRATERS.map(([x, y, s]) => `vec3(${x.toFixed(3)}, ${y.toFixed(3)}, ${s.toFixed(3)})`).join(", ");

  const material = new ShaderMaterial({
    uniforms: {
      uDisc: { value: new Color(palette.moon) },
      uGlow: { value: new Color(palette.moonGlow) },
      uCrater: { value: craterColor },
      uStrength: { value: glowStrength },
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uDisc; uniform vec3 uGlow; uniform vec3 uCrater; uniform float uStrength;
      const vec3 CRATERS[${CRATERS.length}] = vec3[${CRATERS.length}](${craterUniform});
      void main() {
        vec2 p = (vUv - 0.5) * ${(QUAD_RADII * 2).toFixed(1)}; // position in disc radii
        float d = length(p);
        float glow = pow(clamp(1.0 - d / ${QUAD_RADII.toFixed(1)}, 0.0, 1.0), 2.6) * uStrength;
        float disc = 1.0 - smoothstep(0.985, 1.015, d);
        vec3 body = uDisc;
        for (int i = 0; i < ${CRATERS.length}; i++) {
          float c = 1.0 - smoothstep(CRATERS[i].z * 0.9, CRATERS[i].z, length(p - CRATERS[i].xy));
          body = mix(body, uCrater, c);
        }
        gl_FragColor = vec4(mix(uGlow, body, disc), mix(glow, 1.0, disc));
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const size = MOON_RADIUS * QUAD_RADII * 2;
  const quad = new Mesh(new PlaneGeometry(size, size), material);
  quad.name = "moon-disc";
  quad.renderOrder = 1;
  group.add(quad);

  return {
    object: group,
    update: (t) => {
      material.uniforms.uStrength.value = glowStrength * (0.92 + 0.08 * Math.sin(t * 0.8)); // slow breathing
    },
  };
}
