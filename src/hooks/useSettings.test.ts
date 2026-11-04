// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./useSettings";
import { DEFAULT_SETTINGS, ZOOM_MAX, ZOOM_MIN } from "../utils/settings";

const KEY = "raku-settings";
const stored = () => JSON.parse(localStorage.getItem(KEY)!);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
});

describe("loading", () => {
  it("starts from the defaults", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("uses what was saved, and fixes values that are not valid", () => {
    localStorage.setItem(KEY, JSON.stringify({ paperZoom: 9999, paperWidth: "wide", spellcheck: "yes" }));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.paperZoom).toBe(ZOOM_MAX);
    expect(result.current.settings.paperWidth).toBe("wide");
    expect(result.current.settings.spellcheck).toBe(DEFAULT_SETTINGS.spellcheck);
  });

  it("falls back to the defaults when the saved text is broken", () => {
    localStorage.setItem(KEY, "{broken");
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("changing", () => {
  it("saves every change", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ paperWidth: "narrow" }));
    expect(result.current.settings.paperWidth).toBe("narrow");
    expect(stored().paperWidth).toBe("narrow");
  });

  it("does not accept a value that is not allowed", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ autosaveDelay: 12345 }));
    expect(result.current.settings.autosaveDelay).toBe(DEFAULT_SETTINGS.autosaveDelay);
  });

  it("zooms by a step and stays inside the limits", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.zoomBy(10));
    expect(result.current.settings.paperZoom).toBe(110);
    act(() => result.current.zoomBy(10_000));
    expect(result.current.settings.paperZoom).toBe(ZOOM_MAX);
    act(() => result.current.zoomBy(-10_000));
    expect(result.current.settings.paperZoom).toBe(ZOOM_MIN);
  });

  it("resets only the zoom", () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.update({ paperWidth: "wide" });
      result.current.zoomBy(50);
    });
    act(() => result.current.resetZoom());
    expect(result.current.settings.paperZoom).toBe(DEFAULT_SETTINGS.paperZoom);
    expect(result.current.settings.paperWidth).toBe("wide");
  });

  it("resets everything", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.update({ paperWidth: "wide", spellcheck: true }));
    act(() => result.current.reset());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("effects on the page", () => {
  it("turns motion off and on with the reduce motion setting", () => {
    const { result } = renderHook(() => useSettings());
    expect(document.documentElement.classList.contains("raku-no-motion")).toBe(false);
    act(() => result.current.update({ reduceMotion: true }));
    expect(document.documentElement.classList.contains("raku-no-motion")).toBe(true);
    act(() => result.current.update({ reduceMotion: false }));
    expect(document.documentElement.classList.contains("raku-no-motion")).toBe(false);
  });

  it("scales the whole interface through the root font size", () => {
    const { result } = renderHook(() => useSettings());
    expect(document.documentElement.style.fontSize).toBe("16px");
    act(() => result.current.update({ uiScale: 125 }));
    expect(document.documentElement.style.fontSize).toBe("20px");
    expect(document.documentElement.style.getPropertyValue("--ui-scale")).toBe("1.25");
  });
});
