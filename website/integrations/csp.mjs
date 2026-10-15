import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const META = /(<meta\b[^>]*http-equiv="content-security-policy"[^>]*\bcontent=")([^"]*)("[^>]*>)/i;

/** Hash inline tags emitted by trusted integrations (Starlight's is:inline scripts, for example). */
export function completePageCsp(html) {
  const meta = html.match(META);
  if (!meta) throw new Error("Built HTML is missing Astro's CSP meta tag");
  const directives = meta[2].split(";").map((s) => s.trim()).filter(Boolean);
  for (const tag of ["script", "style"]) {
    const index = directives.findIndex((d) => d.startsWith(`${tag}-src `));
    if (index < 0) throw new Error(`Missing ${tag}-src in Astro's CSP`);
    const sources = new Set(directives[index].split(/\s+/));
    for (const match of html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi"))) {
      if (tag === "script" && /\bsrc\s*=/i.test(match[1])) continue;
      if (!match[2].trim()) continue;
      // The HTML parser normalizes line endings before CSP checks an inline tag.
      const hash = createHash("sha256").update(match[2].replace(/\r\n?/g, "\n")).digest("base64");
      sources.add(`'sha256-${hash}'`);
    }
    directives[index] = [...sources].join(" ");
  }
  const policyTag = `${meta[1]}${directives.join("; ")};${meta[3]}`;
  const withoutPolicy = html.replace(META, "");
  // Starlight places its theme script early in <head>. Enforce CSP before it and every other tag,
  // while leaving the charset declaration first so browsers still detect UTF-8 correctly.
  const anchor = /<meta\b[^>]*\bcharset=[^>]*>/i.test(withoutPolicy)
    ? /<meta\b[^>]*\bcharset=[^>]*>/i : /<head\b[^>]*>/i;
  if (!anchor.test(withoutPolicy)) throw new Error("Built HTML has no head for its CSP");
  return withoutPolicy.replace(anchor, (tag) => tag + policyTag);
}

export default function completeCsp() {
  return {
    name: "raku-complete-csp",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        async function visit(directory) {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await visit(path);
            else if (entry.name.endsWith(".html")) {
              await writeFile(path, completePageCsp(await readFile(path, "utf8")));
            }
          }
        }
        await visit(fileURLToPath(dir));
      },
    },
  };
}
