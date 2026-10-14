// PROTOTYPE (spike): petals that whirl around the view while the world turns over, and a glowing line along the horizon.
import {
  AdditiveBlending, DoubleSide, Euler, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry,
  Quaternion, Scene, ShapeGeometry, Shape, ShaderMaterial, Vector3, type PerspectiveCamera, type WebGLRenderer,
} from "three";
import { mulberry32 } from "./rng";
import type { Palette } from "./palette";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---- the petal whirl -----------------------------------------------------------------------------------------

export const VORTEX = { count: 200, zNear: 3, zFar: 16, turns: 1.6 };

/** How strongly the whirl is going at this point of the flip: nothing at either end, full in the middle. */
export function whirlStrength(flip: number): number {
  return Math.pow(Math.sin(Math.PI * clamp(flip)), 1.3);
}

function petalShape(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(-0.5, 0); s.bezierCurveTo(-0.3, 0.42, 0.3, 0.42, 0.5, 0); s.bezierCurveTo(0.3, -0.42, -0.3, -0.42, -0.5, 0);
  return new ShapeGeometry(s);
}

/**
 * Hundreds of petals in camera space, so they circle the middle of the screen no matter how the world is turned. Each
 * one is stretched along the way it is moving, so at full whirl they read as streaks of pink rather than dots.
 * Add `object` to the camera (and the camera to the scene) so the petals travel with it.
 */
export function buildWhirl(palette: Palette) {
  const rng = mulberry32(88);
  const geo = petalShape();
  const mat = new MeshBasicMaterial({ color: palette.petal, side: DoubleSide, transparent: true, opacity: 0.95, fog: false });
  const mesh = new InstancedMesh(geo, mat, VORTEX.count);
  mesh.name = "petal-whirl";
  mesh.frustumCulled = false;
  const group = new Group();
  group.name = "whirl";
  group.add(mesh);

  const items = Array.from({ length: VORTEX.count }, () => ({
    angle: rng() * Math.PI * 2,
    depth: VORTEX.zNear + rng() * (VORTEX.zFar - VORTEX.zNear),
    spread: 0.15 + rng() * 0.95, // where it sits between the middle of the view and its edge
    speed: 0.8 + rng() * 0.9,
    size: 0.08 + rng() * 0.13,
    flutter: rng() * Math.PI * 2,
    late: rng() * 0.25, // petals join the whirl at slightly different moments
  }));

  const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3();
  const update = (time: number, flip: number, fov: number, aspect: number) => {
    const strength = whirlStrength(flip);
    mesh.visible = strength > 0.002;
    if (!mesh.visible) return;
    const half = Math.tan((fov * Math.PI) / 360);
    items.forEach((it, i) => {
      const own = clamp((strength - it.late) / (1 - it.late));
      const theta = it.angle + flip * Math.PI * 2 * VORTEX.turns * it.speed;
      const reach = it.depth * half * it.spread * (0.5 + 0.8 * own); // spirals outward as it picks up speed
      p.set(Math.cos(theta) * reach * aspect, Math.sin(theta) * reach, -it.depth);
      e.set(Math.sin(time * 2 + it.flutter) * 0.9, 0, theta + Math.PI / 2); // long axis along the direction of travel
      q.setFromEuler(e);
      const size = it.size * (it.depth / 8) * Math.pow(own, 0.6);
      s.set(size * (1 + 3.2 * own), size, size);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { object: group, mesh, update, dispose() { geo.dispose(); mat.dispose(); } };
}

// ---- the horizon flash ---------------------------------------------------------------------------------------

/**
 * The true horizon as seen from `camera`, as a line a*x + b*y + c = 0 in normalised screen coordinates (x and y from
 * -1 to 1). Whatever the camera's tilt and roll, this is where flat ground meets the sky at eye level.
 */
export function horizonLine(camera: PerspectiveCamera): { a: number; b: number; c: number } {
  const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion.clone().invert()); // world up, in camera space
  const t = Math.tan((camera.fov * Math.PI) / 360);
  return { a: up.x * t * camera.aspect, b: up.y * t, c: -up.z };
}

/** How bright the flash is: a single swell that peaks at the half turn. */
export function flashStrength(flip: number): number {
  const d = (clamp(flip) - 0.5) / 0.14;
  return Math.exp(-d * d);
}

/** A full-screen quad that draws the glowing horizon over the finished scene, and a soft flare from the moon's side. */
export function createHorizonFlash() {
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({
    uniforms: { uLine: { value: new Vector3(0, 1, 0) }, uAmount: { value: 0 }, uAspect: { value: 1 }, uTime: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uLine;
      uniform float uAmount, uAspect, uTime;
      void main() {
        vec2 ndc = vUv * 2.0 - 1.0;
        vec2 p = vec2(ndc.x * uAspect, ndc.y);
        vec2 n = vec2(uLine.x / uAspect, uLine.y);
        float len = length(n);
        float d = abs(dot(n, p) + uLine.z) / max(len, 0.0001);   // distance to the horizon, in screen heights
        vec2 along = vec2(-n.y, n.x) / max(len, 0.0001);
        float s = dot(p, along);                                  // position along the line
        float core = exp(-pow(d / 0.006, 2.0));
        float glow = exp(-pow(d / 0.045, 2.0));
        float halo = exp(-pow(d / 0.25, 2.0));
        float sweep = exp(-pow((s - sin(uTime * 0.7) * 0.6) * 1.6, 2.0));    // a brighter patch drifting along the line
        float ends = 1.0 - smoothstep(0.9, 2.2, abs(s));
        vec3 col = vec3(1.0, 0.92, 0.95) * core * (0.8 + 0.8 * sweep)
                 + vec3(0.95, 0.22, 0.22) * glow * (0.55 + 0.5 * sweep)
                 + vec3(0.35, 0.18, 0.6) * halo * 0.35;
        col *= ends * uAmount;
        gl_FragColor = vec4(col, 1.0);
      }`,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  return {
    scene, camera, material,
    /** Aim the flash at the camera's horizon; returns false (and draws nothing) when it is too faint to matter. */
    set(view: PerspectiveCamera, flip: number, time: number): boolean {
      const amount = flashStrength(flip);
      material.uniforms.uAmount.value = amount;
      if (amount < 0.003) return false;
      const { a, b, c } = horizonLine(view);
      material.uniforms.uLine.value.set(a, b, c);
      material.uniforms.uAspect.value = view.aspect;
      material.uniforms.uTime.value = time;
      return true;
    },
    draw(renderer: WebGLRenderer) {
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = true;
    },
    dispose() { quad.geometry.dispose(); material.dispose(); },
  };
}

export type Whirl = ReturnType<typeof buildWhirl>;
