import { CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, type Texture } from "three";
import { mulberry32 } from "./rng";
import type { Palette } from "./palette";
import type { ScenePart } from "./index";

/** Auspicious-cloud motifs (puffs with spiral curls and a trailing tail) on a far dome, drifting right to left. */
export const CLOUDS = { count: 5, distance: 180, azMin: -56, azMax: 56, fadeDeg: 10, elMin: 19, elMax: 36 };

/** Azimuth in degrees at time t for a cloud that starts at startAz and drifts left, wrapping round the dome. */
export function cloudAzimuth(t: number, startAz: number, speedDegPerSec: number): number {
  const span = CLOUDS.azMax - CLOUDS.azMin;
  const x = (startAz - CLOUDS.azMin - t * speedDegPerSec) % span;
  return CLOUDS.azMin + (x < 0 ? x + span : x);
}

/** 0 at the wrap-around edges, 1 in the middle, so a cloud fades out and in instead of popping. */
export function cloudEdgeFade(az: number): number {
  const edge = Math.min(az - CLOUDS.azMin, CLOUDS.azMax - az);
  return Math.min(1, Math.max(0, edge / CLOUDS.fadeDeg));
}

// ---- artwork -----------------------------------------------------------------------------------------------

export const CLOUD_TEX = { w: 1024, h: 512 };

/** The 2D calls the artwork needs, so it can be drawn on a canvas or on a recording stand-in in tests. */
export interface Ctx2D {
  fillStyle: unknown;
  beginPath(): void; closePath(): void; fill(): void;
  moveTo(x: number, y: number): void; lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
}

type Pt = [number, number];

interface Variant {
  puffs: number; headX: number; spread: number; size: number; tailEnd: number; tailRise: number; curls: number; twinTail: boolean;
}
export const CLOUD_VARIANTS: Variant[] = [
  { puffs: 5, headX: 0.1, spread: 0.36, size: 1, tailEnd: 0.97, tailRise: 0.07, curls: 2, twinTail: true }, // billowing bank with a long tail
  { puffs: 4, headX: 0.12, spread: 0.27, size: 1.1, tailEnd: 0.9, tailRise: -0.04, curls: 2, twinTail: false }, // compact cloud
  { puffs: 2, headX: 0.1, spread: 0.12, size: 0.62, tailEnd: 0.98, tailRise: 0.12, curls: 1, twinTail: false }, // thin streak with a curl at its head
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** A line of varying thickness along `pts` (thickness w0 at the start, w1 at the end), filled as one polygon. */
function ribbon(ctx: Ctx2D, pts: Pt[], w0: number, w1: number) {
  const n = pts.length;
  const left: Pt[] = [], right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const half = lerp(w0, w1, i / (n - 1)) / 2;
    left.push([pts[i][0] - (dy / len) * half, pts[i][1] + (dx / len) * half]);
    right.push([pts[i][0] + (dy / len) * half, pts[i][1] - (dx / len) * half]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); // round start
  ctx.arc(pts[0][0], pts[0][1], w0 / 2, 0, Math.PI * 2);
  ctx.fill();
}

/** A tapering curl that winds in towards (cx, cy). */
function spiral(ctx: Ctx2D, cx: number, cy: number, r0: number, turns: number, start: number, dir: number, w0: number, w1: number) {
  const pts: Pt[] = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const s = i / N, r = r0 * Math.pow(1 - s, 0.85) + 1, a = start + dir * turns * Math.PI * 2 * s;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  ribbon(ctx, pts, w0, w1);
}

/**
 * Paints one cloud as a mask: white where the cloud is, black where a swirl line cuts through it, black outside.
 * The cloud is used as an alpha map, so the cuts show the sky behind. The tail trails to the right
 * because the cloud drifts left.
 */
export function drawCloudMask(ctx: Ctx2D, variant: number, seed: number) {
  const { w, h } = CLOUD_TEX;
  const v = CLOUD_VARIANTS[variant % CLOUD_VARIANTS.length];
  const rng = mulberry32(seed);
  const base = h * 0.64; // the underside

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";

  // puffs: a row of circles, tallest in the middle, resting on the underside
  const puffs: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < v.puffs; i++) {
    const t = v.puffs === 1 ? 0.5 : i / (v.puffs - 1);
    const hump = Math.max(0, 1 - Math.abs(t - 0.45) / 0.62);
    const r = h * (0.1 + 0.2 * hump) * v.size * (0.9 + 0.2 * rng());
    puffs.push({ x: w * (v.headX + v.spread * t) + r * 0.6, y: base - r * (0.78 + 0.1 * rng()), r });
  }
  for (const p of puffs) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  const first = puffs[0], last = puffs[puffs.length - 1];
  const under = h * 0.075 * v.size;
  ctx.beginPath(); // the underside, rounded at both ends
  ctx.moveTo(first.x, base - under * 2);
  ctx.lineTo(last.x, base - under * 2);
  ctx.arc(last.x, base - under, under, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(first.x, base);
  ctx.arc(first.x, base - under, under, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();

  // the tail: a horn that sweeps out behind the cloud in a gentle S and ends in a point
  const bx = last.x + last.r * 0.35, tipX = w * v.tailEnd, tipY = base - h * (0.03 + v.tailRise), L = tipX - bx;
  const up: [Pt, Pt, Pt, Pt] = [[bx, base - h * 0.17], [bx + L * 0.35, base - h * 0.2], [bx + L * 0.62, base - h * 0.01 + h * v.tailRise * 0.4], [tipX, tipY]];
  const lo: [Pt, Pt, Pt, Pt] = [[tipX, tipY], [bx + L * 0.6, base + h * 0.05], [bx + L * 0.3, base + h * 0.04], [bx, base - h * 0.01]];
  ctx.beginPath();
  ctx.moveTo(up[0][0], up[0][1]);
  ctx.bezierCurveTo(up[1][0], up[1][1], up[2][0], up[2][1], up[3][0], up[3][1]);
  ctx.bezierCurveTo(lo[1][0], lo[1][1], lo[2][0], lo[2][1], lo[3][0], lo[3][1]);
  ctx.closePath();
  ctx.fill();
  if (v.twinTail) { // a second, thinner tail below the first
    const y0 = base + h * 0.01, tip2: Pt = [lerp(bx, tipX, 0.86), tipY + h * 0.09];
    ctx.beginPath();
    ctx.moveTo(bx - L * 0.02, y0 - h * 0.025);
    ctx.bezierCurveTo(bx + L * 0.3, y0 + h * 0.07, bx + L * 0.55, y0 + h * 0.12, tip2[0], tip2[1]);
    ctx.bezierCurveTo(bx + L * 0.5, y0 + h * 0.08, bx + L * 0.25, y0 + h * 0.08, bx - L * 0.02, y0 + h * 0.025);
    ctx.closePath();
    ctx.fill();
  }

  // the swirl lines are cut out in black
  ctx.fillStyle = "#000";
  const byRadius = [...puffs].sort((a, b) => b.r - a.r).slice(0, v.curls);
  byRadius.forEach((p, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    spiral(ctx, p.x + p.r * 0.05, p.y + p.r * 0.02, p.r * 0.62, 1.15, -0.9 + i * 1.1, dir, p.r * 0.075, p.r * 0.018);
  });
  if (variant % CLOUD_VARIANTS.length === 0) { // only the big bank gets a line that follows the top edge of its biggest puff
    const big = byRadius[0];
    const arc: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * (1.08 + 0.7 * (i / 24));
      arc.push([big.x + big.r * 0.82 * Math.cos(a), big.y + big.r * 0.82 * Math.sin(a)]);
    }
    ribbon(ctx, arc, big.r * 0.02, big.r * 0.045);
  }
  // a flowing line along the middle of the tail
  const spine: Pt[] = [];
  for (let i = 0; i <= 30; i++) spine.push(bezier([bx - last.r * 0.5, base - h * 0.07], [bx + L * 0.3, base - h * 0.14], [bx + L * 0.6, base - h * 0.02 + h * v.tailRise * 0.3], [tipX - L * 0.12, tipY + h * 0.005], i / 30));
  ribbon(ctx, spine, h * 0.022, h * 0.003);
}

/** Bake the shaded body and moonlit rim once. Each cloud still needs just one quad and one texture lookup. */
function makeArtwork(variant: number, seed: number, palette: Palette): Texture | undefined {
  if (typeof document === "undefined") return undefined; // no DOM (unit tests): the cloud is then a plain quad
  const canvas = document.createElement("canvas");
  canvas.width = CLOUD_TEX.w;
  canvas.height = CLOUD_TEX.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  drawCloudMask(ctx as unknown as Ctx2D, variant, seed);
  const image = ctx.getImageData(0, 0, CLOUD_TEX.w, CLOUD_TEX.h);
  const pixels = image.data, mask = new Uint8Array(CLOUD_TEX.w * CLOUD_TEX.h);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 1];
  const top = new Color(palette.cloud).lerp(new Color(0xd2d4ed), 0.35).getHex();
  const bottom = new Color(palette.cloud).lerp(new Color(0x283b69), 0.42).getHex();
  const rimColor = [220, 221, 238];
  for (let y = 0; y < CLOUD_TEX.h; y++) {
    const shade = Math.min(1, Math.max(0, (y / CLOUD_TEX.h - 0.16) / 0.62));
    const row = [16, 8, 0].map((shift) => lerp((top >> shift) & 255, (bottom >> shift) & 255, shade));
    const above = Math.max(0, y - 3) * CLOUD_TEX.w;
    for (let x = 0; x < CLOUD_TEX.w; x++) {
      const i = y * CLOUD_TEX.w + x, p = i * 4;
      const rim = Math.max(0, mask[i] - mask[above + x]) / 255 * 0.55;
      pixels[p] = lerp(row[0], rimColor[0], rim);
      pixels[p + 1] = lerp(row[1], rimColor[1], rim);
      pixels[p + 2] = lerp(row[2], rimColor[2], rim);
      pixels[p + 3] = mask[i] * (0.95 - shade * 0.12);
    }
  }
  ctx.putImageData(image, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---- scene part ----------------------------------------------------------------------------------------------

export function buildClouds(palette: Palette): ScenePart {
  const rng = mulberry32(33);
  const r = (a: number, b: number) => a + rng() * (b - a);
  const group = new Group();
  group.name = "clouds";
  const rad = Math.PI / 180;
  const artwork = CLOUD_VARIANTS.map((_, i) => makeArtwork(i, 100 + i, palette));

  const items = Array.from({ length: CLOUDS.count }, (_, i) => {
    const variant = i % CLOUD_VARIANTS.length;
    const widthDeg = r(20, 34) * (variant === 2 ? 0.85 : 1);
    const width = 2 * CLOUDS.distance * Math.tan((widthDeg / 2) * rad);
    const material = new MeshBasicMaterial({
      color: 0xffffff, map: artwork[variant] ?? null, transparent: true, opacity: 0, depthWrite: false, fog: false,
    });
    const mesh = new Mesh(new PlaneGeometry(width, width / 2), material);
    mesh.name = "cloud";
    mesh.renderOrder = 1;
    group.add(mesh);
    // bigger clouds read as nearer, so they drift a little faster
    return { mesh, material, startAz: CLOUDS.azMin + ((i + 0.5) / CLOUDS.count) * (CLOUDS.azMax - CLOUDS.azMin) + r(-4, 4), // spread round the dome
      el: i % 2 === 0 ? r(CLOUDS.elMin, 27) : r(27, CLOUDS.elMax), // alternate low and high so neighbours do not overlap
      speed: 0.3 + widthDeg * 0.02 + r(0, 0.15), bob: r(0, Math.PI * 2), alpha: palette.cloudAlpha };
  });

  const place = (t: number) => {
    for (const it of items) {
      const az = cloudAzimuth(t, it.startAz, it.speed);
      const el = (it.el + Math.sin(t * 0.15 + it.bob) * 0.4) * rad; // barely rises and falls
      const a = az * rad;
      it.mesh.position.set(
        CLOUDS.distance * Math.cos(el) * Math.sin(a),
        CLOUDS.distance * Math.sin(el),
        -CLOUDS.distance * Math.cos(el) * Math.cos(a),
      );
      it.mesh.lookAt(0, 0, 0); // face the camera
      it.material.opacity = cloudEdgeFade(az) * it.alpha;
    }
  };
  place(0);

  return { object: group, update: (t) => place(t) };
}
