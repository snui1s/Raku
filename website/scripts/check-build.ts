// Post-build sanity check for the home page. Run after `astro build`.
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const problems: string[] = [];

const download = html.match(/<a[^>]*data-download[^>]*>/);
if (!download) problems.push("no element with data-download");
else if (!/href="https:\/\/github\.com\/snui1s\/Raku\//.test(download[0])) {
  problems.push("download link does not point at github.com/snui1s/Raku/");
}
const downloads = html.match(/data-download/g)?.length ?? 0;
if (downloads < 2) problems.push(`expected a download link in the hero and one on the fox's tag, found ${downloads}`);
if (!html.includes('id="hero-scene"')) problems.push('missing id="hero-scene"');
if (!html.includes('id="notebook-editor"') || !html.includes("A quiet night")) problems.push("missing the notebook with its sample note");if (!html.includes("More info")) problems.push("missing the SmartScreen note");
if (!html.includes('property="og:image" content="https://raku.snui1s.com/og.png"')) problems.push("missing the og:image tag");
const ld = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
try {
  const app = (JSON.parse(ld?.[1] ?? "") as { "@graph": { "@type": string; isAccessibleForFree?: boolean; downloadUrl?: string }[] })["@graph"].find((n) => n["@type"] === "SoftwareApplication");
  if (!app?.isAccessibleForFree || !app.downloadUrl?.startsWith("https://github.com/snui1s/Raku/")) problems.push("the structured data has no free SoftwareApplication with a download URL");
} catch {
  problems.push("missing or invalid JSON-LD structured data");
}
const titleOf = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
if (!/open-source/i.test(titleOf) || titleOf.length > 65) problems.push("the home page title should mention open source and stay under 65 characters: " + titleOf);
const metaDescription = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
if (metaDescription.length < 70 || metaDescription.length > 160) problems.push("the meta description should be 70 to 160 characters, it is " + metaDescription.length);
if (!existsSync("dist/og.png")) problems.push("dist/og.png is missing");
const robots = existsSync("dist/robots.txt") ? readFileSync("dist/robots.txt", "utf8") : "";
if (!robots.includes("Sitemap: https://raku.snui1s.com/sitemap-index.xml")) problems.push("robots.txt is missing or has no Sitemap line");

if (problems.length) {
  console.error("check-build failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("check-build ok");
