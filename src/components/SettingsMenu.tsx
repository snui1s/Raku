import { useEffect, useRef } from "react";
import { Settings as SettingsIcon, RotateCcw, Check } from "lucide-react";
import {
  AUTOSAVE_DELAYS,
  LINE_HEIGHTS,
  PaperWidth,
  Settings,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  UI_SCALES,
} from "../utils/settings";
import { THEMES } from "../constants/themes";

interface SettingsMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  resetZoom: () => void;
  reset: () => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  currentTheme: string;
  setCurrentTheme: (id: string) => void;
  version: string;
}

const WIDTHS: { id: PaperWidth; label: string }[] = [
  { id: "narrow", label: "Narrow" },
  { id: "medium", label: "Medium" },
  { id: "wide", label: "Wide" },
  { id: "full", label: "Full" },
];

const SHORTCUTS: [string, string][] = [
  ["Search / jump to note", "Ctrl K"],
  ["New note", "Ctrl N"],
  ["Zoom paper", "Ctrl + Scroll"],
  ["Zoom in / out / reset", "Ctrl + / - / 0"],
  ["Zen mode", "Ctrl Shift Z"],
  ["Show / hide toolbar", "Ctrl Shift T"],
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-3 py-2.5">
      <h3 className="mb-2 text-[0.625rem] font-bold uppercase tracking-widest text-app-muted">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-app-text">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex p-0.5 rounded-xl bg-app-tertiary"
    >
      {options.map((o) => (
        <button
          key={String(o.id)}
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-[10px] text-xs transition-[background-color,color,box-shadow] duration-150 ${
            o.id === value
              ? "bg-app-main text-app-text font-medium shadow-sm"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-app-tertiary border border-app-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export function SettingsMenu({
  open,
  setOpen,
  settings,
  update,
  resetZoom,
  reset,
  isDark,
  setIsDark,
  currentTheme,
  setCurrentTheme,
  version,
}: SettingsMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 active:scale-90 hover:bg-app-tertiary ${
          open
            ? "bg-app-tertiary text-app-text"
            : "text-app-muted hover:text-app-text"
        }`}
        title="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SettingsIcon size={17} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Settings"
          className="absolute right-0 top-full mt-2 w-90 max-h-[75vh] overflow-y-auto rounded-2xl border border-app-border bg-app-dropdown backdrop-blur-xl shadow-2xl z-100 raku-pop divide-y divide-app-border"
        >
          <Section title="Paper">
            <div>
              <Row label="Zoom">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-xs font-mono tabular-nums text-app-muted">
                    {settings.paperZoom}%
                  </span>
                  <button
                    onClick={resetZoom}
                    disabled={settings.paperZoom === 100}
                    className="p-1 rounded-lg text-app-muted hover:text-accent hover:bg-app-tertiary disabled:opacity-30 disabled:hover:text-app-muted disabled:hover:bg-transparent transition-colors"
                    title="Reset zoom (Ctrl 0)"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </Row>
              <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={ZOOM_STEP}
                value={settings.paperZoom}
                onChange={(e) => update({ paperZoom: Number(e.target.value) })}
                aria-label="Paper zoom"
                className="w-full mt-2 accent-(--raku-accent)"
              />
            </div>
            <Row label="Width">
              <Segmented
                label="Paper width"
                value={settings.paperWidth}
                options={WIDTHS}
                onChange={(v) => update({ paperWidth: v })}
              />
            </Row>
            <Row label="Line spacing">
              <Segmented
                label="Line spacing"
                value={settings.lineHeight}
                options={LINE_HEIGHTS.map((l) => ({
                  id: l.value,
                  label: l.label,
                }))}
                onChange={(v) => update({ lineHeight: v })}
              />
            </Row>
          </Section>

          <Section title="Writing">
            <Row label="Auto-save after">
              <Segmented
                label="Auto-save delay"
                value={settings.autosaveDelay}
                options={AUTOSAVE_DELAYS.map((a) => ({
                  id: a.value,
                  label: a.label,
                }))}
                onChange={(v) => update({ autosaveDelay: v })}
              />
            </Row>
            <Row label="Spell check">
              <Toggle
                label="Spell check"
                checked={settings.spellcheck}
                onChange={(v) => update({ spellcheck: v })}
              />
            </Row>
            <Row label="Show folder and edit time">
              <Toggle
                label="Show folder and edit time"
                checked={settings.showNoteInfo}
                onChange={(v) => update({ showNoteInfo: v })}
              />
            </Row>
          </Section>

          <Section title="Appearance">
            <Row label="Interface scale">
              <Segmented
                label="Interface scale"
                value={settings.uiScale}
                options={UI_SCALES.map((s) => ({ id: s, label: `${s}%` }))}
                onChange={(v) => update({ uiScale: v })}
              />
            </Row>
            <Row label="Dark mode">
              <Toggle label="Dark mode" checked={isDark} onChange={setIsDark} />
            </Row>
            <Row label="Reduce animations">
              <Toggle
                label="Reduce animations"
                checked={settings.reduceMotion}
                onChange={(v) => update({ reduceMotion: v })}
              />
            </Row>
            <div>
              <span className="text-sm text-app-text">Theme</span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTheme(t.id)}
                    title={t.name}
                    aria-label={t.name}
                    aria-pressed={currentTheme === t.id}
                    className={`h-9 rounded-xl flex items-center justify-center border transition-[transform,border-color] duration-150 hover:scale-105 ${
                      currentTheme === t.id
                        ? "border-app-text"
                        : "border-app-border"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: t.accent }}
                    >
                      {currentTheme === t.id && (
                        <Check size={12} className="text-white" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Shortcuts">
            <ul className="space-y-1.5">
              {SHORTCUTS.map(([name, keys]) => (
                <li
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-app-text">{name}</span>
                  <kbd className="text-[0.6875rem] font-mono px-1.5 py-0.5 rounded-md border border-app-border text-app-muted">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </Section>

          <div className="flex items-center justify-between px-3 py-2.5 text-xs text-app-muted">
            <span className="font-mono">Raku v{version}</span>
            <button
              onClick={reset}
              className="px-2.5 py-1 rounded-lg hover:text-accent hover:bg-app-tertiary transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
