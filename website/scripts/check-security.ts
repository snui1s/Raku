// Validate the policy actually shipped in every built page, including trusted third-party inline tags.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const problems: string[] = [];
let pages = 0;
function visit(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { visit(path); continue; }
    if (!entry.name.endsWith(".html")) continue;
    pages++;
    const html = readFileSync(path, "utf8");
    const meta = html.match(/<meta\b[^>]*http-equiv="content-security-policy"[^>]*\bcontent="([^"]*)"/i);
    if (!meta) { problems.push(`${path}: no CSP`); continue; }
    if (meta.index! > html.search(/<(script|style)\b/i)) problems.push(`${path}: CSP appears after executable content`);
    const directives = new Map(meta[1].split(";").filter((d) => d.trim()).map((d) => {
      const [name, ...sources] = d.trim().split(/\s+/);
      return [name, sources];
    }));
    for (const name of ["default-src", "connect-src", "font-src"]) {
      if (directives.get(name)?.join(" ") !== "'self'") problems.push(`${path}: ${name} must stay on this origin`);
    }
    for (const name of ["base-uri", "object-src", "frame-src"]) {
      if (directives.get(name)?.join(" ") !== "'none'") problems.push(`${path}: ${name} must be blocked`);
    }
    if (!directives.has("script-src")) problems.push(`${path}: missing script policy`);
    for (const name of ["script-src", "script-src-elem"]) {
      const scripts = directives.get(name);
      if (scripts && (!scripts.includes("'self'") || scripts.some((s) => !["'self'", "'wasm-unsafe-eval'"].includes(s) && !/^'sha(256|384|512)-[^']+'$/.test(s)))) {
        problems.push(`${path}: permissive ${name}`);
      }
    }
    if (directives.has("script-src-attr") && directives.get("script-src-attr")?.join(" ") !== "'none'") problems.push(`${path}: inline event handlers must be blocked`);
    for (const tag of ["script", "style"]) {
      const sources = directives.get(`${tag}-src-elem`) ?? directives.get(`${tag}-src`) ?? [];
      if (sources.includes("'unsafe-inline'")) problems.push(`${path}: ${tag} elements must use hashes`);
      for (const match of html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi"))) {
        if (tag === "script" && /\bsrc\s*=/i.test(match[1])) continue;
        if (!match[2].trim()) continue;
        const hash = createHash("sha256").update(match[2].replace(/\r\n?/g, "\n")).digest("base64");
        if (!sources.includes(`'sha256-${hash}'`)) problems.push(`${path}: inline ${tag} is missing its hash`);
      }
    }
  }
}
visit("dist");
if (!pages) problems.push("No built HTML pages found");

// frame-ancestors is ignored in a meta tag; it must be an HTTP header on the deployment.
const config = JSON.parse(readFileSync("vercel.json", "utf8"));
const headers = new Map<string, string>(config.headers.find((rule: { source: string }) => rule.source === "/(.*)")?.headers.map((h: { key: string; value: string }) => [h.key.toLowerCase(), h.value]) ?? []);
if (headers.get("content-security-policy") !== "frame-ancestors 'none'") problems.push("Missing framing policy in Vercel headers");
if (headers.get("x-frame-options") !== "DENY") problems.push("Missing X-Frame-Options: DENY");
if (headers.get("x-content-type-options") !== "nosniff") problems.push("Missing X-Content-Type-Options: nosniff");

if (problems.length) {
  console.error("Security checks failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`Security checks passed: ${pages} pages with complete CSP hashes and deployment framing protection`);
