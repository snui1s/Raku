import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  clampZoom,
  sanitizeSettings,
} from "../utils/settings";

const STORAGE_KEY = "raku-settings";

const load = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable: settings just won't persist
    }
  }, [settings]);

  // "No motion" override, on top of the OS-level reduced-motion preference
  useEffect(() => {
    document.documentElement.classList.toggle("raku-no-motion", settings.reduceMotion);
  }, [settings.reduceMotion]);

  // Interface scale: everything sized in rem follows the root font size
  useEffect(() => {
    const s = settings.uiScale / 100;
    document.documentElement.style.fontSize = `${16 * s}px`;
    document.documentElement.style.setProperty("--ui-scale", String(s));
  }, [settings.uiScale]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => sanitizeSettings({ ...prev, ...patch }));
  }, []);

  /** Change the paper zoom relative to its current value (used by Ctrl+wheel / shortcuts) */
  const zoomBy = useCallback((delta: number) => {
    setSettings((prev) => ({ ...prev, paperZoom: clampZoom(prev.paperZoom + delta) }));
  }, []);

  const resetZoom = useCallback(() => {
    setSettings((prev) => ({ ...prev, paperZoom: DEFAULT_SETTINGS.paperZoom }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return { settings, update, zoomBy, resetZoom, reset };
}
