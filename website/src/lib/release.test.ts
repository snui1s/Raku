import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RELEASES_URL, loadRelease, parseRelease } from "./release";

const URL_OK =
  "https://github.com/snui1s/Raku/releases/download/v1.1.1/Raku_1.1.1_x64-setup.exe";
const file = (over: Record<string, unknown> = {}) => ({
  version: "1.1.1",
  platforms: { "windows-x86_64": { url: URL_OK, signature: "x" } },
  ...over,
});
const FALLBACK = { version: null, url: RELEASES_URL };

describe("parseRelease", () => {
  it("returns version and url for a valid file", () => {
    expect(parseRelease(file())).toEqual({ version: "1.1.1", url: URL_OK });
  });

  it("falls back when the windows platform is missing", () => {
    expect(parseRelease(file({ platforms: {} }))).toEqual(FALLBACK);
    expect(parseRelease(file({ platforms: undefined }))).toEqual(FALLBACK);
  });

  it("falls back when the url is not https", () => {
    const p = { "windows-x86_64": { url: URL_OK.replace("https", "http") } };
    expect(parseRelease(file({ platforms: p }))).toEqual(FALLBACK);
  });

  it("falls back when the host is not github.com or the file is not an .exe", () => {
    const other = { "windows-x86_64": { url: "https://evil.example/Raku.exe" } };
    expect(parseRelease(file({ platforms: other }))).toEqual(FALLBACK);
    const zip = { "windows-x86_64": { url: URL_OK.replace(".exe", ".zip") } };
    expect(parseRelease(file({ platforms: zip }))).toEqual(FALLBACK);
  });

  it("drops an invalid version but keeps a valid url", () => {
    expect(parseRelease(file({ version: "1.1" }))).toEqual({ version: null, url: URL_OK });
    expect(parseRelease(file({ version: "abc" }))).toEqual({ version: null, url: URL_OK });
  });

  it("falls back for non-object input", () => {
    for (const bad of [null, [], "text", 42, undefined]) {
      expect(parseRelease(bad)).toEqual(FALLBACK);
    }
  });
});

describe("loadRelease", () => {
  it("falls back for a missing file", () => {
    expect(loadRelease(join(tmpdir(), "does-not-exist-raku.json"))).toEqual(FALLBACK);
  });

  it("falls back for invalid JSON and reads a valid file", () => {
    const dir = mkdtempSync(join(tmpdir(), "raku-release-"));
    const bad = join(dir, "bad.json");
    writeFileSync(bad, "{ not json");
    expect(loadRelease(bad)).toEqual(FALLBACK);
    const good = join(dir, "good.json");
    writeFileSync(good, JSON.stringify(file()));
    expect(loadRelease(good)).toEqual({ version: "1.1.1", url: URL_OK });
  });
});
