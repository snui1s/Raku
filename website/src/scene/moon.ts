import {
  AdditiveBlending, CircleGeometry, Color, Group, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry, ShaderMaterial,
} from "three";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** The moon sits on a far dome, up and to the left of the headline. */
export const MOON = { azimuthDeg: -16, elevationDeg: 31, distance: 210, angularRadiusDeg: 3.4 };

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

  const radius = MOON.distance * Math.tan(MOON.angularRadiusDeg * rad);

  // soft glow: a radial falloff on a quad (no canvas or texture needed)
  const glowMat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(palette.moonGlow) }, uStrength: { value: palette.night ? 0.5 : 0.35 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader:
      "varying vec2 vUv; uniform vec3 uColor; uniform float uStrength;" +
      "void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.6) * uStrength; gl_FragColor = vec4(uColor, a); }",
    transparent: true,
    depthWrite: false,
    blending: palette.night ? AdditiveBlending : NormalBlending,
    fog: false,
  });
  const glow = new Mesh(new PlaneGeometry(radius * 7, radius * 7), glowMat);
  glow.name = "moon-glow";
  glow.renderOrder = 1;
  group.add(glow);

  const disc = new Mesh(new CircleGeometry(radius, 48), new MeshBasicMaterial({ color: palette.moon, fog: false }));
  disc.name = "moon-disc";
  disc.renderOrder = 2;
  group.add(disc);

  // a few flat craters (slightly darker than the disc)
  const crater = new MeshBasicMaterial({ color: palette.night ? 0xf0e2b8 : 0xd3dbe5, fog: false });
  [[-0.32, 0.28, 0.2], [0.3, -0.12, 0.14], [-0.05, -0.4, 0.11], [0.12, 0.42, 0.08]].forEach(([x, y, s], i) => {
    const c = new Mesh(new CircleGeometry(radius * s, 24), crater);
    c.position.set(x * radius, y * radius, 0.01 * (i + 1));
    c.renderOrder = 3;
    group.add(c);
  });

  return {
    object: group,
    update: (t) => {
      glowMat.uniforms.uStrength.value = (palette.night ? 0.5 : 0.35) * (0.92 + 0.08 * Math.sin(t * 0.8)); // slow breathing
    },
  };
}
