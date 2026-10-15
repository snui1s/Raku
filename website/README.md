# Raku website

Source of `https://raku.snui1s.com`: an Astro site with Tailwind, Starlight docs, a scroll-driven Three.js home page and a notebook you can write in. It is a separate project from the app, with its own `package.json`.

## Develop

Requires [Bun](https://bun.sh).

```bash
cd website
bun install
bun run dev        # local dev server
bun run test       # unit tests (release parsing, scene pieces)
bun run check      # type check
bun run build      # production build into dist/
bun scripts/check-build.ts   # sanity check of the built home page
```

## Structure

| Path | What it is |
|---|---|
| `src/pages/index.astro`, `src/components/` | Home page |
| `src/content/docs/docs/` | Docs (Markdown, served under `/docs/`) |
| `src/pages/privacy.astro` | Privacy policy |
| `src/lib/release.ts` | Reads `../update.json` at build time for the download button |
| `src/components/Journey.astro` | The whole home page: one pinned scene and the DOM placed over it |
| `src/scene/` | The 3D scene (Three.js), loaded only on capable desktop browsers. `journey.ts` is the scroll timeline |
| `src/notebook/` | The try-it notebook (TipTap, no React), loaded lazily |
| `src/pages/still.astro` | Page used only to render the hero images |
| `public/hero/` | Generated hero images (two sizes, `dark.*` and `dark-sm.*`) |

### Download button

`src/lib/release.ts` reads `update.json` from the repository root. The release workflow commits that file to `main` after each release, which triggers a Vercel deploy, so the button always points at the latest installer. If the file is missing or invalid, the button links to the GitHub Releases page.

### The home page

The home page always shows a pre-rendered image first. The live 3D scene mounts over it only when WebGL works, `prefers-reduced-motion` is off, the window is at least 768 px wide and the pointer is not touch. Otherwise the image stays and the page is plain sections in the same order (features list, notebook, numbers, download).

With the live scene the page is one tall section with a pinned frame, and scrolling drives a timeline (`src/scene/journey.ts`, lengths in screen heights):

1. **Hero**: the camera as in the still.
2. **Stars**: the camera tilts up into the night sky; each feature is a star with a label.
3. **Write**: the camera comes back down to the glade and holds while a notebook floats in front of the tree. It is a real editor.
4. **Numbers**: the camera moves to the gate; the four numbers hang under paper lanterns.
5. **Download**: the camera moves in on the fox, whose wooden tag (an *ema*) carries the Download link.

All text, buttons and the notebook are real DOM, placed over the canvas by projecting 3D anchor points to the screen every frame. To change the pacing edit `JOURNEY` and `CONSTELLATION` (scroll lengths); to move the camera edit `GLADE` and `GATE` in `journey.ts` and `foxCamera` in `fox.ts`; lantern positions are `LANTERNS` in `lanterns.ts`.

Focusing something in another chapter (Tab) scrolls the page to that chapter first. The **Features** link in the nav goes to where the stars begin.

#### The notebook

`src/notebook/` builds an editor from the same TipTap extensions the app uses (headings, lists, checklists, highlight, color, quote) with a small toolbar. The page renders its sample note as plain HTML first and the editor takes over when the visitor nears it or touches it. Nothing is saved or sent anywhere; reloading clears it. It works with or without the live scene, including on phones.

The scene has the torii, a sakura tree, grass, falling petals, a river, a sitting fox, black-eyed Susans and poppies scattered over the hill, clouds, a moon, stars and wind gusts that move the grass, tree, petals and fox tail. Add `?fps` to the home page URL to see a readout of frame rate, draw calls and triangles.

After **any change to `src/scene/`**, regenerate the images and commit them:

```bash
bun run stills
```

This builds the site and renders `public/hero/*.webp|avif` with Google Chrome (it must be installed). No local web server is used. The script runs under Node 22.6 or newer (not Bun: on Windows Bun cannot talk to Chrome and the launch times out).

## Sizes (measured at build time on 2026-10-15)

- 3D (`scene.*.js` plus the shared Three.js chunk): about 620 KB raw, 162 KB gzip, 135 KB Brotli. It loads only when the live scene runs.
- Notebook (`mount.*.js`, TipTap and ProseMirror): 387 KB raw, 120 KB gzip, 102 KB Brotli. It loads when the visitor scrolls near the notebook or touches it, with or without the live scene.
- Frame rate and draw calls on a real GPU have not been measured; use `?fps`.

## Deploy (manual steps for the repository owner)

1. In Vercel, import the `snui1s/Raku` repository.
2. Set **Root Directory** to `website/`. Framework preset: Astro. Build command `bun run build`, output `dist`.
3. In the project's **Settings, Domains**, add `raku.snui1s.com`.
4. At your DNS provider, add the record Vercel shows for that domain. For a subdomain this is normally a `CNAME` for `raku` pointing to `cname.vercel-dns.com` (use the exact value Vercel displays).
5. Wait for Vercel to issue the HTTPS certificate, then open the site.

Pull requests get preview deployments automatically. The `Website` GitHub Actions workflow builds and tests the site when `website/` or `update.json` changes.
