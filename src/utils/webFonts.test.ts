// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { loadWebFonts, WEB_FONTS_URL } from "./webFonts";
import { AVAILABLE_FONTS } from "../constants/app";

beforeEach(() => {
  document.head.innerHTML = "";
});

describe("loadWebFonts", () => {
  it("adds the Google Fonts stylesheet to the head", () => {
    loadWebFonts();
    const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe(WEB_FONTS_URL);
  });

  it("adds it only once", () => {
    loadWebFonts();
    loadWebFonts();
    expect(document.head.querySelectorAll("link")).toHaveLength(1);
  });

  it("covers every toolbar font that is not bundled with the app", () => {
    const bundled = ["Google Sans", "LINE Seed"];
    for (const font of AVAILABLE_FONTS) {
      if (bundled.includes(font.name)) continue;
      expect(WEB_FONTS_URL, font.name).toContain(`family=${font.name.replace(/ /g, "+")}`);
    }
  });
});
