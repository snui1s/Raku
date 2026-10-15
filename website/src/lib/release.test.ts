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

  it("falls back for invalid versions or an installer from a different version", () => {
    for (const version of ["1.1", "abc", "01.1.1", "1.1.1\n", "1.1.2", undefined]) {
      expect(parseRelease(file({ version }))).toEqual(FALLBACK);
    }
  });

  it.each([
    URL_OK.replace("snui1s/Raku", "attacker/Raku"),
    URL_OK.replace("snui1s/Raku", "snui1s/Raku-fork"),
    URL_OK.replace("github.com", "github.com.evil.example"),
    URL_OK.replace("github.com", "attacker@github.com"),
    URL_OK.replace("github.com", "github.com:8443"),
    URL_OK.replace("github.com", "github.com:443"),
    URL_OK.replace("/v1.1.1/", "/v1.1.2/"),
    URL_OK.replace("Raku_1.1.1_x64", "Raku_1.1.2_x64"),
    URL_OK.replace("/Raku/releases", "/%52aku/releases"),
    URL_OK.replace("/download/", "/download/other/../"),
    URL_OK + "?redirect=elsewhere",
    URL_OK + "#elsewhere",
    " " + URL_OK,
    URL_OK + "\n",
    URL_OK.replaceAll("/", "\\"),
  ])("rejects a noncanonical download URL: %s", (url) => {
    expect(parseRelease(file({ platforms: { "windows-x86_64": { url } } }))).toEqual(FALLBACK);
  });

  it("rejects version line endings even when both the tag and filename copy them", () => {
    for (const version of ["1.1.1\n", "1.1.1\r", "1.1.1\r\n"]) {
      const url = `https://github.com/snui1s/Raku/releases/download/v${version}/Raku_${version}_x64-setup.exe`;
      expect(parseRelease(file({ version, platforms: { "windows-x86_64": { url } } }))).toEqual(FALLBACK);
    }
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
