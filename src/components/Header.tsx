import { PanelLeft, Sun, Moon } from "lucide-react";
import { usePomodoro } from "../hooks/usePomodoro";

interface HeaderProps {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentTime: Date;
}

export function Header({
  isDark,
  setIsDark,
  sidebarOpen,
  setSidebarOpen,
  currentTime,
}: HeaderProps) {
  const {
    isRunning,
    startPomodoro,
    adjustMinutes,
    formatPomodoro,
  } = usePomodoro();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <header
      className={`h-12 shrink-0 flex items-center justify-between px-8 border-b ${
        isDark ? "border-[#262626]" : "border-neutral-200"
      }`}
    >
      {/* Left: Sidebar Toggle (when closed) + Clock */}
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? "text-neutral-500 hover:text-white hover:bg-neutral-800"
                : "text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
            }`}
            title="Show Sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-1.5 rounded-md transition-colors ${
            isDark
              ? "text-neutral-500 hover:text-[#F25C54] hover:bg-neutral-800"
              : "text-neutral-400 hover:text-[#F25C54] hover:bg-neutral-100"
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div
          className={`text-xs ${
            isDark ? "text-neutral-500" : "text-neutral-400"
          }`}
        >
          <span className="font-medium">{formatDate(currentTime)}</span>
          <span
            className={`mx-2 ${
              isDark ? "text-neutral-700" : "text-neutral-300"
            }`}
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
          className={`w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors text-sm font-bold ${
            isDark
              ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
          }`}
        >
          −
        </button>
        <span
          className={`font-mono text-sm w-12 text-center ${
            isDark ? "text-neutral-300" : "text-[#171717]"
          }`}
        >
          {formatPomodoro()}
        </span>
        <button
          onClick={() => adjustMinutes(5)}
          disabled={isRunning}
          className={`w-6 h-6 flex items-center justify-center rounded disabled:opacity-30 transition-colors text-sm font-bold ${
            isDark
              ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
          }`}
        >
          +
        </button>
        <button
          onClick={startPomodoro}
          className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${
            isRunning
              ? "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
              : "bg-[#F25C54]/20 text-[#F25C54] hover:bg-[#F25C54]/30"
          }`}
        >
          {isRunning ? "Stop" : "Focus"}
        </button>
      </div>
    </header>
  );
}
