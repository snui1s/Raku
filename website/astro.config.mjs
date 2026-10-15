import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import completeCsp from "./integrations/csp.mjs";

export default defineConfig({
  site: "https://raku.snui1s.com",
  // Starlight supplies syntax highlighting through Expressive Code.
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-src 'none'",
        "form-action 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
      ],
      // Pagefind compiles its local search index with WebAssembly; JavaScript eval stays blocked.
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
      // The scene positions DOM labels and the editor uses inline colour/formatting attributes.
      styleDirective: { resources: [{ resource: "'unsafe-inline'", kind: "attribute" }] },
    },
  },
  integrations: [
    // /still only exists to render the hero images; keep it out of the sitemap
    sitemap({ filter: (page) => !page.includes("/still") }),
    starlight({
      title: "Raku",
      description: "A free, open-source note-taking app for Windows. Fast, offline, no account.",
      favicon: "/favicon.svg",
      // link previews (the home page and privacy page set the same tags in layouts/Base.astro)
      head: [
        { tag: "meta", attrs: { property: "og:image", content: "https://raku.snui1s.com/og.png" } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
        { tag: "meta", attrs: { name: "twitter:image", content: "https://raku.snui1s.com/og.png" } },
      ],
      logo: { src: "./src/assets/logo.svg", alt: "Raku" },
      customCss: ["./src/styles/starlight.css"],
      routeMiddleware: "./src/docsRouteData.ts",
      // dark only: no theme picker, and the theme is always set to dark
      components: {
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      sidebar: [
        { label: "Docs home", slug: "docs" },
        { label: "Getting started", slug: "docs/getting-started" },
        {
          label: "Guides",
          items: [
            { slug: "docs/guides/writing-and-images" },
            { slug: "docs/guides/folders" },
            { slug: "docs/guides/search" },
            { slug: "docs/guides/focus-tools" },
            { slug: "docs/guides/zoom-and-settings" },
            { slug: "docs/guides/keyboard-shortcuts" },
          ],
        },
        {
          label: "Your data",
          items: [
            { slug: "docs/guides/export-and-backup" },
            { slug: "docs/guides/your-data" },
          ],
        },
        {
          label: "Help",
          items: [
            { slug: "docs/guides/troubleshooting" },
            { label: "Report a bug", link: "https://github.com/snui1s/Raku/issues" },
          ],
        },
        { label: "Privacy", link: "/privacy/" },
      ],
    }),
    completeCsp(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // The notebook's editor is loaded on demand, so the dev server would find it only after the page is open, bundle it
    // then, and answer the already-open page with "504 Outdated Optimize Dep" (the notebook stays dead until a restart).
    optimizeDeps: {
      include: [
        "@tiptap/core",
        "@tiptap/starter-kit",
        "@tiptap/extension-task-list",
        "@tiptap/extension-task-item",
        "@tiptap/extension-highlight",
        "@tiptap/extension-text-style",
        "@tiptap/extension-color",
        "@tiptap/extension-placeholder",
      ],
    },
  },
});
