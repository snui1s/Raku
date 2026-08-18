import { PanelLeft, Sun, Moon, Palette, Check, Sparkles, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePomodoro } from "../hooks/usePomodoro";
import { THEMES } from "../constants/themes";

interface HeaderProps {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentTime: Date;
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
  zenMode: boolean;
  setZenMode: (zen: boolean) => void;
  onOpenExport: () => void;
}

export function Header({
  isDark,
  setIsDark,
  sidebarOpen,
  setSidebarOpen,
  currentTime,
  currentTheme,
  setCurrentTheme,
  zenMode,
  setZenMode,
  onOpenExport,
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme);

  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-8 border-b relative z-50 transition-colors duration-200 border-app-border bg-app-main"
    >
      {/* Left: Sidebar Toggle (when closed) + Dark Mode + Theme Picker + Clock */}
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
            title="Show Sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-1.5 rounded-md transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Theme Picker Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-app-muted hover:text-accent hover:bg-app-tertiary"
            title="Theme Palette"
          >
            <Palette size={16} />
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 transition-colors"
              style={{ backgroundColor: activeThemeObj?.accent || "#F25C54" }}
            />
          </button>

          {themeOpen && (
            <div
              className="absolute top-full left-0 mt-2 p-2 rounded-xl shadow-2xl z-[100] min-w-[210px] backdrop-blur-md bg-app-dropdown border-app-border text-app-text border"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-app-muted">
                Select Theme Palette
              </div>
              <div className="space-y-1 mt-1">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTheme(t.id);
                      setThemeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      currentTheme === t.id
                        ? "bg-app-tertiary text-app-text font-semibold shadow-xs"
                        : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs"
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

        {/* Zen Focus Mode Toggle */}
        <button
          onClick={() => setZenMode(!zenMode)}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium ${
            zenMode
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:text-accent hover:bg-app-tertiary"
          }`}
          title="Zen Focus Mode (Ctrl+Shift+Z)"
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">Zen Mode</span>
        </button>

        {/* Export Note Button */}
        <button
          onClick={onOpenExport}
          className="p-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium text-app-muted hover:text-accent hover:bg-app-tertiary"
          title="Export Note (.md / PDF)"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="w-px h-3.5 border-app-border mx-1" />

        <div
          className="text-xs text-app-muted"
        >
          <span className="font-medium">{formatDate(currentTime)}</span>
          <span
            className="mx-2 opacity-50"
          >
            •
          </span>
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Right: Pomodoro */}
      <div className="flex items-center gap-2">
        <span className="text-sm">🍅</span>
        <button
          onClick={() => adjustMinutes(-5)}
          disabled={isRunning}
          className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors text-sm font-bold bg-app-tertiary text-app-text hover:opacity-80"
        >
          −
        </button>
        <span
          className="font-mono text-sm w-12 text-center text-app-text"
        >
          {formatPomodoro()}
        </span>
        <button
          onClick={() => adjustMinutes(5)}
          disabled={isRunning}
          className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors text-sm font-bold bg-app-tertiary text-app-text hover:opacity-80"
        >
          +
        </button>
        <button
          onClick={startPomodoro}
          className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            isRunning
              ? "bg-app-tertiary text-app-muted hover:opacity-80"
              : "bg-accent-muted text-accent hover:opacity-80"
          }`}
        >
          {isRunning ? "Stop" : "Focus"}
        </button>
      </div>
    </header>
  );
}

