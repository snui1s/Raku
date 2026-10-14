import {
  PanelLeft,
  Sun,
  Moon,
  Palette,
  Check,
  Maximize2,
  Timer,
  Minus,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { usePomodoro } from "../hooks/usePomodoro";
import { THEMES } from "../constants/themes";

interface HeaderProps {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
  zenMode: boolean;
  setZenMode: (zen: boolean) => void;
  exportMenu: ReactNode;
  settingsMenu: ReactNode;
  crumbs: string[];
}

const iconBtn =
  "w-9 h-9 flex items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 active:scale-90 text-app-muted hover:text-app-text hover:bg-app-tertiary";

export function Header({
  isDark,
  setIsDark,
  sidebarOpen,
  setSidebarOpen,
  currentTheme,
  setCurrentTheme,
  zenMode,
  setZenMode,
  exportMenu,
  settingsMenu,
  crumbs,
}: HeaderProps) {
  const { isRunning, startPomodoro, adjustMinutes, formatPomodoro } =
    usePomodoro();

  const [themeOpen, setThemeOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme);

  return (
    <header className="h-14 shrink-0 flex items-center gap-1 px-5 relative z-50 raku-fade">
      {/* Left: sidebar toggle + breadcrumb */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={iconBtn}
          title="Show Sidebar"
        >
          <PanelLeft size={17} />
        </button>
      )}
      <nav
        className="ml-2 flex items-center gap-2 min-w-0 text-xs font-mono text-app-muted"
        aria-label="Location"
      >
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span className="opacity-40">/</span>}
            <span
              className={`truncate ${
                i === crumbs.length - 1 ? "text-app-text font-medium" : ""
              }`}
            >
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Pomodoro */}
      <div
        className={`flex items-center h-8 mr-1 rounded-full border text-xs font-mono transition-all ${
          isRunning
            ? "bg-accent border-accent text-white shadow-lg shadow-accent/30"
            : "border-app-border text-app-muted hover:border-accent"
        }`}
      >
        {!isRunning && (
          <button
            onClick={() => adjustMinutes(-5)}
            className="pl-2 pr-0.5 h-full hover:text-accent"
            title="-5 min"
            aria-label="Decrease minutes"
          >
            <Minus size={12} />
          </button>
        )}
        <button
          onClick={startPomodoro}
          className="flex items-center gap-1.5 px-2.5 h-full tabular-nums"
          title={isRunning ? "Stop focus timer" : "Start focus timer"}
        >
          <Timer size={14} />
          {formatPomodoro()}
        </button>
        {!isRunning && (
          <button
            onClick={() => adjustMinutes(5)}
            className="pr-2 pl-0.5 h-full hover:text-accent"
            title="+5 min"
            aria-label="Increase minutes"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Theme Picker */}
      <div className="relative" ref={themeMenuRef}>
        <button
          onClick={() => setThemeOpen(!themeOpen)}
          className={`${iconBtn} relative`}
          title="Theme palette"
        >
          <Palette size={17} />
          <span
            className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-app-sidebar"
            style={{ backgroundColor: activeThemeObj?.accent || "#F25C54" }}
          />
        </button>

        {themeOpen && (
          <div className="absolute top-full right-0 mt-2 p-2 rounded-2xl shadow-2xl z-100 min-w-55 backdrop-blur-xl bg-app-dropdown border-app-border text-app-text border raku-pop">
            <div className="px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-app-muted">
              Theme
            </div>
            <div className="space-y-0.5 mt-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTheme(t.id);
                    setThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    currentTheme === t.id
                      ? "bg-app-tertiary text-app-text font-semibold"
                      : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {currentTheme === t.id && (
                    <Check size={14} className="text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsDark(!isDark)}
        className={iconBtn}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {exportMenu}
      {settingsMenu}

      <button
        onClick={() => setZenMode(!zenMode)}
        className={`${iconBtn} ${zenMode ? "bg-accent-muted! text-accent!" : ""}`}
        title="Zen mode (Ctrl+Shift+Z)"
      >
        <Maximize2 size={17} />
      </button>
    </header>
  );
}
