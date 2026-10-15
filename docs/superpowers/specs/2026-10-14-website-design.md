# Raku website: design

Date: 2026-10-14
Status: draft for review

## Goal

A website at `raku.snui1s.com` whose main job is to get people to download Raku. Documentation is secondary. English only. No analytics.

Success looks like:
- A visitor understands what Raku is within one screen and can download it with one click.
- The download button always points at the latest installer without manual edits.
- First-time visitors are told honestly about the Windows SmartScreen warning.
- The hero feels memorable (3D torii and sakura scene) without slowing the page for anyone, and degrades cleanly.

## Decisions (from the design discussion)

| Topic | Decision |
|---|---|
| Primary purpose | Landing page that drives downloads; docs are secondary |
| Hosting | Vercel, custom subdomain `raku.snui1s.com` |
| Stack | Astro + Tailwind, Starlight for docs, in `website/` of the Raku repo |
| Language | English only (structure should not prevent adding Thai later) |
| Look | Same palette, LINE Seed font and logo as the app, one accent color, light and dark, no gradients |
| Hero | 3D scene (Three.js) from the sketch, hero section only |
| 3D assets | Fully procedural, built in code, no model files |
| Interaction | Gentle camera parallax following the mouse, falling petals, swaying grass |
| Fallback | Pre-rendered still images of the same scene (light and dark) |
| Mobile | Still image, no live 3D |
| Analytics | None |
| Download button | Reads `update.json` at build time, falls back to the Releases page |
| SmartScreen | Explained honestly on the home page and in Getting started, permanently |
| Code signing | No signing for now (SignPath Foundation declined the application) |

## Pages (first release)

1. **Home** (`/`): hero, features, app screenshots (light and dark), numbers from `bench/`, download section, SmartScreen note.
2. **Getting started** (`/docs/getting-started`): install, the SmartScreen steps, verifying the download (SHA-256), first launch, updates.
3. **Guides** (`/docs/guides/*`): folders and drag and drop, zoom and settings, search (`Ctrl K`), export and backup, where data is stored and how to back it up by hand.
4. **Privacy policy** (`/privacy`): same content as the README section.

Not in the first release: Changelog, FAQ, Thai translation, a "Code signing policy" page.

## Architecture

```
website/
  astro.config.mjs        site: https://raku.snui1s.com
  package.json            own dependencies, separate from the app
  src/
    pages/index.astro     home
    pages/privacy.astro
    content/docs/...      Starlight Markdown
    components/Hero.astro hero shell: fallback image + canvas mount point
    components/DownloadButton.astro
    scene/                Three.js code (loaded lazily, client only)
      index.ts            entry: capability checks, mount, lifecycle
      torii.ts  tree.ts  grass.ts  petals.ts  hill.ts  theme.ts
    lib/release.ts        reads ../update.json at build time
  scripts/render-stills.ts   renders the fallback images from the same scene
  public/hero/{light,dark}.{webp,avif}   generated stills
```

The app (`src/`, `src-tauri/`) is untouched. The repository root keeps its own `package.json`; `website/` is a separate project so the app's CI and install are unaffected.

### Download button

`lib/release.ts` reads `update.json` from the repo root at build time and returns the version and the installer URL. If the file is missing or malformed, the button links to `https://github.com/snui1s/Raku/releases/latest` and the version label is hidden. The release workflow already commits `update.json` to `main`, which triggers a Vercel deploy, so the button follows each release without extra setup.

### 3D scene

Procedural and self-contained in `website/src/scene/`.

- **Torii:** cylinders and boxes. The kasagi (top beam) is a curved sweep with upturned ends and a dark top band. Proportions follow the prototype in `mockups/landing-hero.html`, which already uses a correct perspective (camera low at the foot of the hill looking up).
- **Tree:** trunk and branches as tapered geometry, blossoms as instanced flat five-petal meshes in three tones, some leaves. Seeded random so the tree is identical on every load.
- **Hill and grass:** a displaced plane and instanced blades with a vertex-shader sway.
- **Petals:** instanced particles drifting from right to left with rotation.
- **Look:** toon shading with soft outlines, flat colors close to the app palette. Light and dark themes change colors and lighting live when the theme toggles.
- **Camera:** small parallax from pointer position, eased. No user-driven orbit.
- **Lifecycle:** Three.js is imported dynamically after first paint. Rendering pauses when the hero is out of view (IntersectionObserver) or the tab is hidden, and resumes on return. The renderer and GPU resources are disposed on page leave.

### Fallback and first paint

The hero always renders the still image first (a `<picture>` with AVIF/WebP and a theme-matched variant). The scene mounts over it and fades in only when all of these hold:

- WebGL is available and the context was created successfully
- `prefers-reduced-motion` is not set
- the viewport is not a phone (width below 768 px, or a coarse pointer)

On a context loss or an error, the scene is removed and the still stays visible. The stills are produced by `scripts/render-stills.ts`, which loads the same scene headlessly and screenshots it, so there is one source of truth.

### Docs

Starlight with the Raku colors and font set through its CSS variables. Markdown content, built-in search (Pagefind), table of contents, and light/dark. Navigation: Getting started, Guides, Privacy.

### SmartScreen note and download verification

- A short note under the home page download button, linking to Getting started.
- Getting started explains "More info, then Run anyway", says the app is not signed with a Windows certificate, and shows how to verify the SHA-256 of the installer.
- The release workflow is extended to publish a `SHA256SUMS` file as a release asset (small separate change to `.github/workflows/release.yml`).

## Build, deploy and CI

- **Vercel:** project root `website/`, build `astro build`, install with the package manager the website uses. Production domain `raku.snui1s.com`. Preview deployments per pull request come for free.
- **CI:** add a job to `.github/workflows/ci.yml` that builds `website/` when `website/**` or `update.json` changes, and nothing in the app jobs depends on it. Path filters keep app-only changes from triggering it.
- **Manual steps for the owner (cannot be done by Claude):** connect the repository to Vercel with Root Directory `website/`; add the CNAME record for `raku` pointing to Vercel and add the domain in the Vercel project settings; confirm HTTPS is issued.

## Performance and quality targets

- Home page without the 3D chunk: HTML, CSS and the hero still under roughly 250 KB transferred; no layout shift from the hero.
- The Three.js chunk is loaded lazily; its size is measured and recorded in the implementation notes. Target: Lighthouse performance 90+ on desktop with the still visible, and no regression when the scene is disabled.
- Accessibility: all meaningful images have alt text, the scene canvas is `aria-hidden`, text contrast meets WCAG AA in both themes, keyboard navigation works on the nav and download button, `prefers-reduced-motion` respected.
- No cookies, no third-party scripts, no analytics. Fonts are self-hosted (LINE Seed already ships with the app).

## Testing

- Unit tests for `lib/release.ts` (valid file, missing file, malformed file, missing `url`).
- A build check that fails if the home page has no download link.
- Visual check of the stills in both themes after every scene change (screenshots from headless Chrome).
- The live 3D scene (smoothness, parallax feel, pause and resume) cannot be verified headlessly; the owner checks it on a real machine and reports back. Claude will say plainly what has and has not been verified.

## Risks

- **Scene tuning:** the look of a procedural 3D tree takes iteration. Mitigation: the SVG prototype in `mockups/` is the visual reference; stills are reviewed before wiring up interaction.
- **Bundle size:** Three.js adds roughly 150 KB (gzip). Mitigation: dynamic import, tree-shaken named imports, no post-processing libraries.
- **Two visual sources:** the live scene and the stills must match. Mitigation: stills are generated from the scene, never drawn separately.
- **update.json as an input:** a bad value could produce a broken link. Mitigation: validation in `release.ts` with the Releases-page fallback.
- **SignPath:** application declined; reapply later when the project has more public visibility. Not a blocker for the site.

## Out of scope (possible later)

Changelog and FAQ pages, Thai translation, Vercel Web Analytics, a scroll-driven full-page 3D experience, a hand-modeled tree, Microsoft Store or paid code signing.
