import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://raku.snui1s.com",
  integrations: [
    // /still only exists to render the hero images and /dive is a prototype; keep both out of the sitemap
    sitemap({ filter: (page) => !page.includes("/still") && !page.includes("/dive") }),
    starlight({
      title: "Raku",
      description: "A fast, distraction-free note-taking app for Windows.",
      favicon: "/favicon.svg",
      logo: { src: "./src/assets/logo.svg", alt: "Raku" },
      customCss: ["./src/styles/starlight.css"],
      // dark only: no theme picker, and the theme is always set to dark
      components: {
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      sidebar: [
        { label: "Getting started", slug: "docs/getting-started" },
        {
          label: "Guides",
          items: [
            { slug: "docs/guides/folders" },
            { slug: "docs/guides/zoom-and-settings" },
            { slug: "docs/guides/search" },
            { slug: "docs/guides/export-and-backup" },
            { slug: "docs/guides/your-data" },
          ],
        },
        { label: "Privacy", link: "/privacy/" },
      ],
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
