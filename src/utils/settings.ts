// App settings: defaults, limits and validation (pure, so it can be unit tested).

export type PaperWidth = "narrow" | "medium" | "wide" | "full";

export interface Settings {
  paperZoom: number; // percent
  paperWidth: PaperWidth;
  lineHeight: number;
  spellcheck: boolean;
  showNoteInfo: boolean;
  autosaveDelay: number; // ms
  reduceMotion: boolean;
  uiScale: number; // percent; scales the interface (not the paper)
}

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 250;
export const ZOOM_STEP = 5;

export const UI_SCALE_MIN = 50;
export const UI_SCALE_MAX = 150;
export const UI_SCALES = [50, 75, 100, 125];

export const PAPER_WIDTHS: Record<PaperWidth, number | null> = {
  narrow: 640,
  medium: 800,
  wide: 1000,
  full: null,
};

export const LINE_HEIGHTS = [
  { label: "Compact", value: 1.6 },
  { label: "Normal", value: 1.85 },
  { label: "Relaxed", value: 2.1 },
];

export const AUTOSAVE_DELAYS = [
  { label: "1s", value: 1000 },
  { label: "2s", value: 2000 },
  { label: "5s", value: 5000 },
];

export const DEFAULT_SETTINGS: Settings = {
  paperZoom: 100,
  paperWidth: "medium",
  lineHeight: 1.85,
  spellcheck: false,
  showNoteInfo: true,
  autosaveDelay: 2000,
  reduceMotion: false,
  uiScale: 100,
};

export const clampUiScale = (s: number): number =>
  Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, Math.round(s / 5) * 5));

export const clampZoom = (z: number): number =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));

const oneOf = <T,>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

/** Turn whatever was stored (possibly old, partial or corrupted) into valid settings. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    paperZoom:
      typeof r.paperZoom === "number" && Number.isFinite(r.paperZoom)
        ? clampZoom(r.paperZoom)
        : d.paperZoom,
    paperWidth: oneOf(r.paperWidth, Object.keys(PAPER_WIDTHS) as PaperWidth[], d.paperWidth),
    lineHeight: oneOf(r.lineHeight, LINE_HEIGHTS.map((l) => l.value), d.lineHeight),
    spellcheck: typeof r.spellcheck === "boolean" ? r.spellcheck : d.spellcheck,
    showNoteInfo: typeof r.showNoteInfo === "boolean" ? r.showNoteInfo : d.showNoteInfo,
    autosaveDelay: oneOf(r.autosaveDelay, AUTOSAVE_DELAYS.map((a) => a.value), d.autosaveDelay),
    reduceMotion: typeof r.reduceMotion === "boolean" ? r.reduceMotion : d.reduceMotion,
    uiScale:
      typeof r.uiScale === "number" && Number.isFinite(r.uiScale)
        ? clampUiScale(r.uiScale)
        : d.uiScale,
  };
}
