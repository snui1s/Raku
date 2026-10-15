// Renders the link-preview image (public/og.png, 1200x630) from the hero still plus the name and tagline.
// Usage: bun run og   (needs Google Chrome installed; run `bun run stills` first if the scene changed)
import { chromium } from "playwright-core";
import sharp from "sharp";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";

const PUBLIC = join(import.meta.dirname, "..", "public");
const ORIGIN = "http://og.local";
const TYPES: Record<string, string> = { ".webp": "image/webp", ".woff2": "font/woff2", ".html": "text/html" };

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: "Rubik"; src: url("/fonts/Rubik-Latin.woff2") format("woff2"); font-weight: 300 900; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0a122e; }
  .card { position: relative; width: 1200px; height: 630px; font-family: "Rubik", system-ui, sans-serif; color: #fff; }
  .card img { position: absolute; left: 300px; top: 0; width: 900px; height: 630px; object-fit: cover; object-position: 38% 70%; }
  /* the scene sits on the right (gate, tree, fox); its left edge fades into the dark panel the text is on */
  .card::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, #0a122e 0%, #0a122e 30%, rgba(10,18,46,0.7) 40%, rgba(10,18,46,0) 56%); }
  .copy { position: absolute; z-index: 2; left: 72px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { margin: 0 0 8px; font-size: 24px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #f25c54; }
  h1 { margin: 0; display: flex; align-items: baseline; gap: 20px; font-size: 140px; line-height: 1; font-weight: 700; letter-spacing: -0.02em; }
  h1 span { font-size: 120px; font-weight: 400; color: #f25c54; font-family: "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif; }
  p.tag { margin: 28px 0 0; font-size: 31px; line-height: 1.3; font-weight: 400; color: #dbe4f7; }
</style></head><body>
  <div class="card">
    <img src="/hero/dark.webp" alt="">
    <div class="copy">
      <p class="eyebrow">Open source · Offline · Windows</p>
      <h1>Raku <span>楽</span></h1>
      <p class="tag">Fast, distraction-free notes.<br>No account. No cloud. Just write.</p>
    </div>
  </div>
</body></html>`;

function fileFor(pathname: string): string | null {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^[\/\\]+/, "");
  const p = join(PUBLIC, rel);
  if (!p.startsWith(PUBLIC + sep)) return null; // never serve outside public/
  return existsSync(p) && statSync(p).isFile() ? p : null;
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.route(`${ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/") return route.fulfill({ status: 200, contentType: TYPES[".html"], body: PAGE });
    const file = fileFor(pathname);
    if (!file) return route.fulfill({ status: 404, body: "not found" });
    return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
  });
  await page.goto(`${ORIGIN}/`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  const png = await page.screenshot({ type: "png" });
  // palette PNG: a smaller file, and the picture is flat colour and gradients
  await sharp(png).png({ palette: true, quality: 90, effort: 10 }).toFile(join(PUBLIC, "og.png"));
  console.log("wrote public/og.png (1200x630)");
} finally {
  await browser.close();
}
