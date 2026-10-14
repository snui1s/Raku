import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  ZOOM_MAX,
  ZOOM_MIN,
  clampZoom,
  sanitizeSettings,
} from "./settings";

describe("clampZoom", () => {
  it("clamps to the allowed range and rounds", () => {
    expect(clampZoom(10)).toBe(ZOOM_MIN);
    expect(clampZoom(999)).toBe(ZOOM_MAX);
    expect(clampZoom(112.6)).toBe(113);
  });
});

describe("sanitizeSettings", () => {
  it("returns defaults for missing or corrupted input", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values", () => {
    const s = sanitizeSettings({ paperZoom: 150, paperWidth: "wide", lineHeight: 2.1, spellcheck: true, autosaveDelay: 5000 });
    expect(s.paperZoom).toBe(150);
    expect(s.paperWidth).toBe("wide");
    expect(s.lineHeight).toBe(2.1);
    expect(s.spellcheck).toBe(true);
    expect(s.autosaveDelay).toBe(5000);
  });

  it("repairs out-of-range or wrong-typed fields individually", () => {
    const s = sanitizeSettings({ paperZoom: 5000, paperWidth: "huge", lineHeight: 7, spellcheck: "yes", autosaveDelay: 1, showNoteInfo: false });
    expect(s.paperZoom).toBe(ZOOM_MAX);
    expect(s.paperWidth).toBe(DEFAULT_SETTINGS.paperWidth);
    expect(s.lineHeight).toBe(DEFAULT_SETTINGS.lineHeight);
    expect(s.spellcheck).toBe(DEFAULT_SETTINGS.spellcheck);
    expect(s.autosaveDelay).toBe(DEFAULT_SETTINGS.autosaveDelay);
    expect(s.showNoteInfo).toBe(false);
  });

  it("rejects NaN zoom", () => {
    expect(sanitizeSettings({ paperZoom: NaN }).paperZoom).toBe(100);
  });
});

describe("uiScale", () => {
  it("defaults to 100 and snaps/clamps stored values", () => {
    expect(sanitizeSettings({}).uiScale).toBe(100);
    expect(sanitizeSettings({ uiScale: 25 }).uiScale).toBe(50);
    expect(sanitizeSettings({ uiScale: 999 }).uiScale).toBe(150);
    expect(sanitizeSettings({ uiScale: 77 }).uiScale).toBe(75);
    expect(sanitizeSettings({ uiScale: NaN }).uiScale).toBe(100);
  });
});
