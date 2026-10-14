// Renders the hero fallback images from the same 3D scene the page uses.
// Usage: bun run stills   (needs Google Chrome installed; no local web server is started)
import { chromium } from "playwright-core";
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";

const DIST = join(import.meta.dirname, "..", "dist");
const OUT = join(import.meta.dirname, "..", "public", "hero");
const ORIGIN = "http://still.local";
const SIZES = [
  { suffix: "", width: 1920, height: 1200 },
  { suffix: "-sm", width: 960, height: 600 },
] as const;
const THEMES = ["light", "dark"] as const;

const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".json": "application/json", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png",
  ".ttf": "font/ttf", ".woff2": "font/woff2",
};

function fileFor(pathname: string): string | null {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^[\/]+/, "");
  let p = join(DIST, rel);
  if (!p.startsWith(DIST + sep) && p !== DIST) return null; // never serve outside dist
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  return existsSync(p) ? p : null;
}

// 1. Build the site so dist/ contains the current scene code
const build = spawnSync("bun", ["run", "build"], { cwd: join(import.meta.dirname, ".."), stdio: "inherit" });
if (build.status !== 0) throw new Error("astro build failed");

mkdirSync(OUT, { recursive: true });

// 2. Render each theme and size with Chrome (software WebGL), serving dist/ from disk
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  for (const theme of THEMES) {
    for (const size of SIZES) {
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
      await page.route(`${ORIGIN}/**`, async (route) => {
        const file = fileFor(new URL(route.request().url()).pathname);
        if (!file) return route.fulfill({ status: 404, body: "not found" });
        return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
      });
      await page.goto(`${ORIGIN}/still/?theme=${theme}`);
      await page.waitForFunction(() => (window as unknown as { __STILL_READY?: boolean }).__STILL_READY === true, null, { timeout: 30000 });
      const png = await page.screenshot({ type: "png" });
      await page.close();

      const base = join(OUT, `${theme}${size.suffix}`);
      await sharp(png).webp({ quality: 80 }).toFile(`${base}.webp`);
      await sharp(png).avif({ quality: 50, effort: 6 }).toFile(`${base}.avif`);
      console.log(`wrote ${theme}${size.suffix}.{webp,avif} (${size.width}x${size.height})`);
    }
  }
} finally {
  await browser.close();
}
