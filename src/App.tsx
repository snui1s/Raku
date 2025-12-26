import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useRef } from "react";
import "./index.css";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pomodoro state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Pomodoro countdown
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      // Optional: play sound or notification here
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const startPomodoro = () => {
    if (!isRunning) {
      setSecondsLeft(pomodoroMinutes * 60);
      setIsRunning(true);
    } else {
      // Stop
      setIsRunning(false);
      setSecondsLeft(0);
    }
  };

  const adjustMinutes = (delta: number) => {
    if (!isRunning) {
      setPomodoroMinutes((m) => Math.max(5, Math.min(60, m + delta)));
    }
  };

  const formatPomodoro = () => {
    if (isRunning || secondsLeft > 0) {
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${pomodoroMinutes.toString().padStart(2, "0")}:00`;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg prose-invert max-w-none focus:outline-none",
      },
    },
    autofocus: true,
  });

  // Mock file list
  const files = [
    { name: "Project Ideas", active: false },
    { name: "Meeting Notes", active: false },
    { name: "Quick Thoughts", active: true },
  ];

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
    <div className="flex w-full h-screen bg-neutral-900 text-neutral-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-neutral-800">
        {/* Sidebar Header */}
        <div className="p-6 pb-4">
          <h1 className="text-xs font-bold tracking-widest text-neutral-500">
            RAKU
          </h1>
        </div>

        {/* Today's Section */}
        <div className="px-6 py-2">
          <div className="text-xs font-semibold text-neutral-500 tracking-wide uppercase mb-3">
            Today's
          </div>
          <nav className="space-y-1">
            {files.map((file, i) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  file.active
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                }`}
              >
                {file.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header: Time + Pomodoro */}
        <header className="h-12 shrink-0 flex items-center justify-between px-8 border-b border-neutral-800">
          {/* Left: Clock */}
          <div className="text-xs text-neutral-500">
            <span className="font-medium">{formatDate(currentTime)}</span>
            <span className="mx-2 text-neutral-700">•</span>
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>

          {/* Right: Pomodoro */}
          <div className="flex items-center gap-2">
            <span className="text-sm">🍅</span>
            <button
              onClick={() => adjustMinutes(-5)}
              disabled={isRunning}
              className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
            >
              −
            </button>
            <span className="font-mono text-sm text-neutral-300 w-12 text-center">
              {formatPomodoro()}
            </span>
            <button
              onClick={() => adjustMinutes(5)}
              disabled={isRunning}
              className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white disabled:opacity-30 transition-colors text-sm font-bold"
            >
              +
            </button>
            <button
              onClick={startPomodoro}
              className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                isRunning
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
              }`}
            >
              {isRunning ? "Stop" : "Focus"}
            </button>
          </div>
        </header>

        {/* Editor */}
        <main
          className="flex-1 overflow-y-auto py-16 px-12 cursor-text"
          onClick={() => editor?.chain().focus().run()}
        >
          <div className="max-w-1xl mx-auto">
            <EditorContent editor={editor} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
