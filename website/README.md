# Raku website

Source of `https://raku.snui1s.com`: an Astro site with Tailwind, Starlight docs and a lazy-loaded Three.js hero. It is a separate project from the app, with its own `package.json`.

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
| `src/scene/` | The 3D hero (Three.js), loaded only on capable desktop browsers |
| `src/pages/still.astro` | Page used only to render the hero images |
| `public/hero/` | Generated hero images (light and dark, two sizes) |

### Download button

`src/lib/release.ts` reads `update.json` from the repository root. The release workflow commits that file to `main` after each release, which triggers a Vercel deploy, so the button always points at the latest installer. If the file is missing or invalid, the button links to the GitHub Releases page.

### The hero

The home page always shows a pre-rendered image first. The live 3D scene mounts over it only when WebGL works, `prefers-reduced-motion` is off, the window is at least 768 px wide and the pointer is not touch. Otherwise the image stays. Rendering pauses when the hero is scrolled out of view or the tab is hidden.

After **any change to `src/scene/`**, regenerate the images and commit them:

```bash
bun run stills
```

This builds the site and renders `public/hero/*.webp|avif` with Google Chrome (it must be installed). No local web server is used.

## Sizes (measured at build time on 2026-10-14)

- Home page without the 3D chunk: about 158 KB with Brotli (HTML, CSS, JS, the desktop hero image and three fonts).
- 3D chunk (`scene.*.js`, Three.js plus the scene): 573 KB raw, about 145 KB gzip, 119 KB Brotli. It loads only when the live scene runs.

## Deploy (manual steps for the repository owner)

1. In Vercel, import the `snui1s/Raku` repository.
2. Set **Root Directory** to `website/`. Framework preset: Astro. Build command `bun run build`, output `dist`.
3. In the project's **Settings, Domains**, add `raku.snui1s.com`.
4. At your DNS provider, add the record Vercel shows for that domain. For a subdomain this is normally a `CNAME` for `raku` pointing to `cname.vercel-dns.com` (use the exact value Vercel displays).
5. Wait for Vercel to issue the HTTPS certificate, then open the site.

Pull requests get preview deployments automatically. The `Website` GitHub Actions workflow builds and tests the site when `website/` or `update.json` changes.
