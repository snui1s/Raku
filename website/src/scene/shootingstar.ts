import { AdditiveBlending, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import type { ScenePart } from "./index";

/** A shooting star on the star dome: a bright head with a fading tail that flies a short way down the sky. */
export const SHOOTING = {
  radius: 218, // just inside the star dome (220)
  length: 40, // of the streak, in world units on the dome (about 10 degrees)
  width: 2.4,
  travel: 72, // how far it flies (about 18 degrees)
  seconds: 0.95,
  pool: 4, // how many can be in the sky at once
};

const VERT = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
// u runs from the tail (0) to the head (1): dim at the tail, brightest at the head, with a small bright tip
const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uP;
  void main() {
    float u = vUv.x;
    float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float body = pow(u, 3.0) * pow(across, 2.5);
    float tip = smoothstep(0.93, 1.0, u) * across;
    float env = sin(3.14159265 * uP);
    float a = (body * 1.5 + tip * 1.2) * env;
    gl_FragColor = vec4(vec3(1.0, 0.96, 0.82) * a, a);
  }
`;

const ease = (p: number) => 1 - (1 - p) * (1 - p); // flies fast at first, then slows as it fades

export function buildShootingStars(rand: () => number = Math.random): ScenePart & { shoot(from: Vector3): void; active(): number } {
  const group = new Group();
  group.name = "shooting-stars";
  const slots = Array.from({ length: SHOOTING.pool }, (_, i) => {
    const material = new ShaderMaterial({
      uniforms: { uP: { value: 0 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    const geometry = new PlaneGeometry(SHOOTING.length, SHOOTING.width);
    geometry.translate(-SHOOTING.length / 2, 0, 0); // the head is at the origin and the tail trails behind it
    const streak = new Mesh(geometry, material);
    streak.frustumCulled = false;
    streak.renderOrder = 3;
    const holder = new Group();
    holder.name = `shooting-star-${i}`;
    holder.visible = false;
    holder.add(streak);
    group.add(holder);
    return { holder, streak, material, age: -1, dir: new Vector3() };
  });

  return {
    object: group,
    active: () => slots.filter((s) => s.age >= 0).length,
    shoot: (from) => {
      // Keep existing flights intact when the fixed pool is full.
      const slot = slots.find((s) => s.age < 0);
      if (!slot) return;
      slot.holder.position.copy(from).setLength(SHOOTING.radius);
      slot.holder.lookAt(0, 0, 0);
      slot.holder.updateMatrixWorld(true);
      // fly down and to the left, with a little variety, whichever way the dome's axes point there
      let angle = Math.PI + 0.35 + (rand() - 0.5) * 0.5;
      const world = new Vector3(Math.cos(angle), Math.sin(angle), 0).transformDirection(slot.holder.matrixWorld);
      if (world.y > 0) angle += Math.PI;
      slot.dir.set(Math.cos(angle), Math.sin(angle), 0);
      slot.streak.rotation.z = angle;
      slot.streak.position.set(0, 0, 0);
      slot.age = 0;
      slot.holder.visible = true;
    },
    update: (_t, dt) => {
      for (const s of slots) {
        if (s.age < 0) continue;
        s.age += Math.max(0, dt ?? 0);
        const p = s.age / SHOOTING.seconds;
        if (p >= 1) {
          s.age = -1;
          s.holder.visible = false;
          s.material.uniforms.uP.value = 0;
          continue;
        }
        s.material.uniforms.uP.value = p;
        s.streak.position.copy(s.dir).multiplyScalar(SHOOTING.travel * ease(p));
      }
    },
  };
}
