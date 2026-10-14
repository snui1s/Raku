import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const RELEASES_URL = "https://github.com/snui1s/Raku/releases/latest";

export interface ReleaseInfo {
  version: string | null;
  url: string;
}

const FALLBACK: ReleaseInfo = { version: null, url: RELEASES_URL };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function validInstallerUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname === "github.com" && u.pathname.endsWith(".exe");
  } catch {
    return false;
  }
}

/** Turn the parsed contents of update.json into the info the download button needs. Never throws. */
export function parseRelease(raw: unknown): ReleaseInfo {
  if (!isRecord(raw)) return FALLBACK;
  const platforms = raw.platforms;
  const win = isRecord(platforms) ? platforms["windows-x86_64"] : undefined;
  const url = isRecord(win) ? win.url : undefined;
  if (!validInstallerUrl(url)) return FALLBACK;
  const version =
    typeof raw.version === "string" && /^\d+\.\d+\.\d+$/.test(raw.version) ? raw.version : null;
  return { version, url };
}

/** Read update.json from the repository root (build runs with the website folder as cwd). Never throws. */
export function loadRelease(path: string = resolve(process.cwd(), "../update.json")): ReleaseInfo {
  try {
    return parseRelease(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return FALLBACK;
  }
}
