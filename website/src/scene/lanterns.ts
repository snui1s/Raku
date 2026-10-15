import {
  AdditiveBlending, Color, CylinderGeometry, Group, LatheGeometry, Mesh, MeshToonMaterial, Path, PlaneGeometry,
  ShaderMaterial, Shape, ShapeGeometry, SphereGeometry, TorusGeometry, Vector2, Vector3, type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { branchPointWorld } from "./tree";
import { windGust } from "./wind";
import { createPendulum } from "./pendulum";
import type { ScenePart } from "./index";

/** The four paper lanterns hang from branches of the cherry tree: which branch, how far along it (0..1), and the
 *  world height of the lantern's centre. The heights are staggered so the numbers under them never collide. */
const HANGS = [
  { branch: 0, t: 0.9, bodyY: 6.6 },
  { branch: 0, t: 0.45, bodyY: 5.3 },
  { branch: 2, t: 0.5, bodyY: 6.5 },
  { branch: 2, t: 0.9, bodyY: 5.2 },
];
const BODY_HALF = 0.45; // half the height of a lantern, caps included

/** Where each cord is tied to its branch (world coordinates). */
export const LANTERN_ATTACH = HANGS.map((h) => branchPointWorld(h.branch, h.t));
/** Where each lantern's centre hangs at rest (world coordinates). */
export const LANTERNS: [number, number, number][] = HANGS.map((h, i) => [LANTERN_ATTACH[i].x, h.bodyY, LANTERN_ATTACH[i].z]);
/** Length of each cord, from the branch to the top of its lantern. */
export const LANTERN_CORDS = HANGS.map((h, i) => LANTERN_ATTACH[i].y - h.bodyY - BODY_HALF);

const PAPER_HALF = 0.375;
const paperRadius = (y: number) => 0.165 + 0.17 * Math.max(0, Math.cos(y / PAPER_HALF * Math.PI / 2)) ** 0.65;

/** The shoulders taper into the lacquer collars; small folds give the paper a ribbed silhouette. */
function paperGeometry(): LatheGeometry {
  const profile = Array.from({ length: 85 }, (_, i) => {
    const v = i / 84, y = (v * 2 - 1) * PAPER_HALF;
    const fold = 0.004 * Math.sin(v * Math.PI) * Math.cos(v * Math.PI * 56);
    return new Vector2(paperRadius(y) + fold, y);
  });
  return new LatheGeometry(profile, 30); // the ribs are drawn in the shader; the shape only needs to be round
}

/** Procedural paper: fine fibres, bamboo ribs and a warmer centre, without downloaded textures. */
function paperMaterial(red: boolean): MeshToonMaterial {
  const material = new MeshToonMaterial({
    color: red ? 0xd84c3e : 0xffe5b4,
    emissive: red ? 0xff5526 : 0xffb95e,
    emissiveIntensity: red ? 0.28 : 0.36,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vPaperUv;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPaperUv = uv;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vPaperUv;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        float ribAA = min(0.3, fwidth(vPaperUv.y) * 87.9646);
        float rib = 1.0 - smoothstep(0.02 - ribAA, 0.24 + ribAA, abs(sin(vPaperUv.y * 87.9646)));
        float fibre = fract(sin(dot(floor(vPaperUv * vec2(750.0, 1100.0)), vec2(12.9898, 78.233))) * 43758.5453);
        float paperShade = (0.985 + fibre * 0.015) * (1.0 - rib * 0.26);
        diffuseColor.rgb *= paperShade;
      `)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        totalEmissiveRadiance *= paperShade * (0.55 + 0.45 * sin(vPaperUv.y * 3.141593));
      `);
  };
  material.customProgramCacheKey = () => "raku-lantern-paper-v1";
  return material;
}

function merged(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return geometry;
}

function ring(radius: number, thickness: number, y: number): TorusGeometry {
  const geometry = new TorusGeometry(radius, thickness, 5, 28);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y, 0);
  return geometry;
}

const LANTERN_MOTIFS = ["sakura", "kitsune", "torii", "raku"] as const;
type LanternMotif = (typeof LANTERN_MOTIFS)[number];

/** Vector emblems stay crisp on close-ups and need no fonts or image textures. */
function motifShapes(motif: LanternMotif): Shape[] {
  if (motif === "sakura") {
    // Five separate petals with notched tips, rather than a star-shaped outline.
    const petal = new Shape();
    petal.moveTo(0, 0.008).bezierCurveTo(-0.016, 0.014, -0.042, 0.046, -0.021, 0.074)
      .quadraticCurveTo(-0.01, 0.083, 0, 0.068).quadraticCurveTo(0.01, 0.083, 0.021, 0.074)
      .bezierCurveTo(0.042, 0.046, 0.016, 0.014, 0, 0.008).closePath();
    const origin = new Vector2();
    const petals = Array.from({ length: 5 }, (_, i) => new Shape(
      petal.getPoints(12).map((point) => point.rotateAround(origin, i * Math.PI * 2 / 5)),
    ));
    const centre = new Shape();
    centre.absarc(0, 0, 0.009, 0, Math.PI * 2, false);
    return [...petals, centre];
  }

  if (motif === "kitsune") {
    const mask = new Shape();
    mask.moveTo(-0.067, 0.09).lineTo(-0.018, 0.055).quadraticCurveTo(0, 0.064, 0.018, 0.055)
      .lineTo(0.067, 0.09).lineTo(0.069, 0.018).quadraticCurveTo(0.082, -0.006, 0.052, -0.035)
      .quadraticCurveTo(0.026, -0.052, 0, -0.087).quadraticCurveTo(-0.026, -0.052, -0.052, -0.035)
      .quadraticCurveTo(-0.082, -0.006, -0.069, 0.018).closePath();
    for (const s of [-1, 1]) {
      const ear = new Path();
      ear.moveTo(s * 0.056, 0.065).lineTo(s * 0.051, 0.029).lineTo(s * 0.029, 0.043).closePath();
      const eye = new Path();
      eye.moveTo(s * 0.056, 0.012).lineTo(s * 0.012, -0.004)
        .lineTo(s * 0.023, -0.023).lineTo(s * 0.049, -0.006).closePath();
      mask.holes.push(ear, eye);
    }
    const nose = new Path();
    nose.moveTo(-0.011, -0.033).lineTo(0.011, -0.033).lineTo(0, -0.049).closePath();
    mask.holes.push(nose);
    return [mask];
  }

  const polygon = (points: [number, number][]) => new Shape(points.map(([x, y]) => new Vector2(x, y)));
  const stroke = (x1: number, y1: number, x2: number, y2: number, width = 0.011) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const dx = -(y2 - y1) / length * width / 2, dy = (x2 - x1) / length * width / 2;
    return polygon([[x1 + dx, y1 + dy], [x2 + dx, y2 + dy], [x2 - dx, y2 - dy], [x1 - dx, y1 - dy]]);
  };

  if (motif === "torii") {
    const roof = new Shape();
    roof.moveTo(-0.085, 0.079).quadraticCurveTo(0, 0.048, 0.085, 0.079)
      .lineTo(0.081, 0.057).quadraticCurveTo(0, 0.026, -0.081, 0.057).closePath();
    return [roof, stroke(-0.072, 0.018, 0.072, 0.018, 0.013),
      stroke(-0.043, 0.052, -0.054, -0.08, 0.014), stroke(0.043, 0.052, 0.054, -0.08, 0.014),
      stroke(0, 0.044, 0, 0.018, 0.009)];
  }

  // A geometric seal of 楽: the white/sun component above the tree component, with side strokes.
  const sun = polygon([[-0.027, 0.066], [0.027, 0.066], [0.027, 0.002], [-0.027, 0.002]]);
  const sunHole = new Path();
  sunHole.moveTo(-0.016, 0.055).lineTo(0.016, 0.055).lineTo(0.016, 0.013).lineTo(-0.016, 0.013).closePath();
  sun.holes.push(sunHole);
  return [sun, stroke(-0.019, 0.033, 0.019, 0.033, 0.008), stroke(-0.009, 0.066, 0.002, 0.084),
    stroke(-0.073, 0.064, -0.044, 0.045), stroke(-0.073, 0.005, -0.044, 0.025),
    stroke(0.073, 0.064, 0.044, 0.045), stroke(0.073, 0.005, 0.044, 0.025),
    stroke(-0.078, -0.026, 0.078, -0.026), stroke(0, 0.005, 0, -0.091),
    stroke(-0.002, -0.034, -0.073, -0.08), stroke(0.002, -0.034, 0.073, -0.08)];
}

/** Repeat one emblem around its lantern, curved to the paper instead of floating on a flat decal. */
function crestGeometry(motif: LanternMotif): BufferGeometry {
  const frame = new Shape();
  frame.absarc(0, 0, 0.118, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, 0.109, 0, Math.PI * 2, true);
  frame.holes.push(hole);
  const shapes = motifShapes(motif);
  const parts: BufferGeometry[] = [];
  for (let side = 0; side < 4; side++) {
    const geometry = new ShapeGeometry([frame, ...shapes], 14);
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      const angle = x / paperRadius(0) + side * Math.PI / 2;
      const radius = paperRadius(y) + 0.009;
      positions.setXYZ(i, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
    geometry.computeVertexNormals();
    parts.push(geometry);
  }
  return merged(parts);
}

/** A soft halo, billboarded in the shader so it still faces the viewer while the lantern swings. */
function glowMaterial(red: boolean): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uGlow: { value: new Color(red ? 0xff6b30 : 0xffc76d) }, uStrength: { value: 0.2 } },
    vertexShader: `varying vec2 vGlowUv;
      void main() {
        vGlowUv = uv;
        vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        centre.xy += position.xy;
        gl_Position = projectionMatrix * centre;
      }`,
    fragmentShader: `varying vec2 vGlowUv; uniform vec3 uGlow; uniform float uStrength;
      void main() {
        float r = length((vGlowUv - 0.5) * 2.0);
        float alpha = exp(-4.5 * r * r) * (1.0 - smoothstep(0.6, 1.0, r)) * uStrength;
        gl_FragColor = vec4(uGlow, alpha);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false,
  });
}

/** Four glowing paper lanterns on cords tied to the tree's branches. They are always there; the numbers chapter
 *  brings the camera in close to them. */
export function buildLanterns(): ScenePart & { centres(): Vector3[] } {
  const group = new Group();
  group.name = "lanterns";
  const dark = new MeshToonMaterial({ color: 0x30201d });
  const gold = new MeshToonMaterial({ color: 0xc99748, emissive: 0xa9561d, emissiveIntensity: 0.16 });
  const silk = new MeshToonMaterial({ color: 0xb83d36 });
  const bodyGeometry = paperGeometry();
  const swings = LANTERN_CORDS.map((cord, i) => createPendulum(cord + BODY_HALF + 0.08, 0.8 + i * 0.06));
  const pivot = new Vector3();
  const bodies: Mesh[] = [];
  const details: { paper: MeshToonMaterial; glow: ShaderMaterial; tassel: Group; base: number }[] = [];
  const lanterns = HANGS.map((_, i) => {
    const cord = LANTERN_CORDS[i];
    const l = new Group(); // pivots where the cord is tied to the branch, so the whole lantern swings from there
    l.name = `lantern-${i}`;
    l.position.copy(LANTERN_ATTACH[i]);
    const top = -cord - BODY_HALF; // height of the lantern's centre below the branch
    const red = i % 2 === 0;
    const paper = paperMaterial(red);
    const body = new Mesh(bodyGeometry, paper);
    body.name = `lantern-${i}-body`;
    body.position.y = top;
    bodies.push(body);
    const hardware: BufferGeometry[] = [
      new CylinderGeometry(0.183, 0.2, 0.055, 22).translate(0, top + 0.392, 0),
      new CylinderGeometry(0.2, 0.183, 0.055, 22).translate(0, top - 0.392, 0),
      new CylinderGeometry(0.008, 0.008, cord, 6).translate(0, -cord / 2, 0),
      new TorusGeometry(0.05, 0.009, 6, 24, Math.PI).translate(0, top + 0.4, 0),
    ];
    const lacquer = new Mesh(merged(hardware), dark);
    lacquer.name = `lantern-${i}-hardware`;
    const trim = new Mesh(merged([
      ring(0.19, 0.009, top + 0.412), ring(0.2, 0.008, top + 0.37),
      ring(0.2, 0.008, top - 0.37), ring(0.19, 0.009, top - 0.412),
      new SphereGeometry(0.025, 12, 8).translate(0, top - 0.443, 0),
    ]), gold);
    trim.name = `lantern-${i}-gold`;
    const motif = LANTERN_MOTIFS[i];
    const emblem = new Mesh(crestGeometry(motif), new MeshToonMaterial({
      color: red ? 0xffe6b8 : 0xad3e33,
      emissive: red ? 0xffba6a : 0x6b1d14, emissiveIntensity: 0.14,
    }));
    emblem.name = `lantern-${i}-${motif}`;
    emblem.position.y = top;

    const tassel = new Group();
    tassel.name = `lantern-${i}-tassel`;
    tassel.position.y = top - 0.44;
    const threads: BufferGeometry[] = [new SphereGeometry(0.022, 12, 8).translate(0, -0.025, 0)];
    for (let thread = 0; thread < 8; thread++) {
      const angle = thread / 8 * Math.PI * 2;
      threads.push(new CylinderGeometry(0.004, 0.006, 0.13, 5)
        .translate(Math.sin(angle) * 0.017, -0.1, Math.cos(angle) * 0.017));
    }
    tassel.add(new Mesh(merged(threads), silk));
    const glow = glowMaterial(red);
    const halo = new Mesh(new PlaneGeometry(1.65, 1.8), glow);
    halo.name = `lantern-${i}-glow`;
    halo.position.y = top;
    l.add(body, lacquer, trim, emblem, tassel, halo);
    details.push({ paper, glow, tassel, base: paper.emissiveIntensity });
    group.add(l);
    return l;
  });
  return {
    object: group,
    centres: () => bodies.map((body) => body.getWorldPosition(new Vector3())),
    update: (t, dt) => {
      const gust = windGust(t);
      group.updateWorldMatrix(true, false);
      const parentTilt = Math.atan2(group.matrixWorld.elements[1], group.matrixWorld.elements[0]);
      lanterns.forEach((l, i) => {
        // The angle stays in world space, so the tree's rotation cannot reset the pendulum's pose.
        pivot.copy(l.position).applyMatrix4(group.matrixWorld);
        const breeze = Math.sin(t * 0.9 + i * 1.7) * 0.05 + gust * 0.06;
        l.rotation.z = swings[i].step(dt, pivot.x, pivot.y, breeze) - parentTilt;
        const light = details[i];
        const pulse = 1 + Math.sin(t * 1.3 + i * 2.1) * 0.035;
        light.paper.emissiveIntensity = light.base * pulse;
        light.glow.uniforms.uStrength.value = 0.2 * pulse;
        light.tassel.rotation.z = Math.sin(t * 1.8 + i * 1.7) * 0.12 + gust * 0.12 - swings[i].velocity * 0.08;
      });
    },
  };
}
