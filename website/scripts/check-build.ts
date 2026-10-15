// Post-build sanity check for the home page. Run after `astro build`.
import { readFileSync } from "node:fs";

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

if (problems.length) {
  console.error("check-build failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("check-build ok");
