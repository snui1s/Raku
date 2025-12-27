import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "./hooks/useNotes";
import {
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  ChevronDown,
  Sun,
  Moon,
  Plus,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import "./index.css";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Dropdown states
  const [headingOpen, setHeadingOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  // Pomodoro state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Update clock every second (real-time)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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
      // Celebration! 🎉
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F25C54", "#FFD93D", "#6BCB77", "#4D96FF"],
      });
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
      UnderlineExtension,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none focus:outline-none ${
          isDark ? "prose-invert" : "prose-neutral"
        }`,
      },
    },
    autofocus: true,
  });

  // Update editor class when theme changes
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose prose-lg max-w-none focus:outline-none ${
              isDark ? "prose-invert" : "prose-neutral"
            }`,
          },
        },
      });
    }
  }, [isDark, editor]);

  // Notes management
  const {
    notes,
    activeNote,
    activeNoteId,
    isLoaded,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
  } = useNotes();

  // Auto-save with debounce
  const saveTimeoutRef = useRef<number | null>(null);

  const handleEditorUpdate = useCallback(() => {
    if (!editor || !activeNoteId) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save - 2 seconds after last keystroke
    saveTimeoutRef.current = window.setTimeout(() => {
      const content = JSON.stringify(editor.getJSON());
      updateNote(activeNoteId, content);
    }, 2000);
  }, [editor, activeNoteId, updateNote]);

  // Attach editor update listener
  useEffect(() => {
    if (editor) {
      editor.on("update", handleEditorUpdate);
      return () => {
        editor.off("update", handleEditorUpdate);
      };
    }
  }, [editor, handleEditorUpdate]);

  // Load note content when switching notes
  useEffect(() => {
    if (editor && activeNote) {
      try {
        const content = activeNote.content
          ? JSON.parse(activeNote.content)
          : { type: "doc", content: [] };
        editor.commands.setContent(content);
      } catch {
        editor.commands.setContent("");
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent("");
    }
  }, [editor, activeNoteId]); // Only trigger on activeNoteId change, not activeNote

  // Create first note if none exist (only after localStorage is loaded)
  useEffect(() => {
    if (isLoaded && notes.length === 0) {
      createNote();
    }
  }, [isLoaded, notes.length, createNote]);

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
    <div
      className={`flex w-full h-screen overflow-hidden ${
        isDark ? "bg-[#0A0A0A] text-[#E5E5E5]" : "bg-white text-[#171717]"
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`w-[280px] shrink-0 flex flex-col border-r ${
          isDark
            ? "border-[#262626] bg-[#0A0A0A]"
            : "border-neutral-200 bg-white"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 ${
                isDark ? "text-[#F25C54]" : "text-[#F25C54]"
              }`}
              viewBox="0 0 64 64"
              fill="none"
            >
              <path
                d="M4 12 C4 8, 32 4, 60 12"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x="8"
                y="16"
                width="48"
                height="4"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="12"
                y="20"
                width="6"
                height="40"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="46"
                y="20"
                width="6"
                height="40"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="10"
                y="14"
                width="10"
                height="6"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="44"
                y="14"
                width="10"
                height="6"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <h1
              className={`text-xs font-bold tracking-widest ${
                isDark ? "text-neutral-500" : "text-neutral-400"
              }`}
            >
              RAKU
            </h1>
          </div>
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
        </div>

        {/* Notes Section */}
        <div className="px-6 py-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-semibold tracking-wide uppercase ${
                isDark ? "text-neutral-500" : "text-neutral-400"
              }`}
            >
              Notes
            </span>
            <button
              onClick={() => createNote()}
              className={`p-1 rounded transition-colors ${
                isDark
                  ? "text-neutral-500 hover:text-[#F25C54] hover:bg-neutral-800"
                  : "text-neutral-400 hover:text-[#F25C54] hover:bg-neutral-100"
              }`}
              title="New Note"
            >
              <Plus size={14} />
            </button>
          </div>
          <nav className="space-y-1">
            {notes.map((note) => (
              <div key={note.id} className="group flex items-center">
                <button
                  onClick={() => selectNote(note.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                    note.id === activeNoteId
                      ? isDark
                        ? "bg-neutral-800 text-neutral-100"
                        : "bg-neutral-100 text-neutral-900"
                      : isDark
                      ? "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                  }`}
                >
                  {note.title || "Untitled"}
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                    isDark
                      ? "text-neutral-600 hover:text-red-400"
                      : "text-neutral-400 hover:text-red-500"
                  }`}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header: Time + Pomodoro */}
        <header
          className={`h-12 shrink-0 flex items-center justify-between px-8 border-b ${
            isDark ? "border-[#262626]" : "border-neutral-200"
          }`}
        >
          {/* Left: Clock */}
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

        {/* Floating Toolbar Island */}
        <div className="flex justify-center py-3 relative z-50">
          <div
            className={`flex items-center gap-0.5 px-2 py-1 backdrop-blur-sm rounded-lg border ${
              isDark
                ? "bg-neutral-800/80 border-neutral-700/50"
                : "bg-white/80 border-neutral-200 shadow-sm"
            }`}
          >
            {/* Undo / Redo */}
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className={`p-2 rounded transition-colors disabled:opacity-30 ${
                isDark
                  ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                  : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
              }`}
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className={`p-2 rounded transition-colors disabled:opacity-30 ${
                isDark
                  ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                  : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
              }`}
              title="Redo"
            >
              <Redo2 size={16} />
            </button>

            <div className="w-px h-4 bg-neutral-700 mx-1" />

            {/* Structure */}
            {/* Heading Dropdown */}
            <div className="relative">
              <button
                className="p-2 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
                title="Heading"
                onClick={() => {
                  setHeadingOpen(!headingOpen);
                  setListOpen(false);
                }}
              >
                <Heading1 size={16} />
                <ChevronDown size={12} />
              </button>
              {headingOpen && (
                <div
                  className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] ${
                    isDark
                      ? "bg-neutral-800 border border-neutral-700"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("heading", { level: 1 })
                        ? "text-[#F25C54]"
                        : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 1 }).run();
                      setHeadingOpen(false);
                    }}
                  >
                    <Heading1 size={16} /> Heading 1
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("heading", { level: 2 })
                        ? "text-[#F25C54]"
                        : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 2 }).run();
                      setHeadingOpen(false);
                    }}
                  >
                    <Heading2 size={16} /> Heading 2
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("heading", { level: 3 })
                        ? "text-[#F25C54]"
                        : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 3 }).run();
                      setHeadingOpen(false);
                    }}
                  >
                    <Heading3 size={16} /> Heading 3
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("heading", { level: 4 })
                        ? "text-[#F25C54]"
                        : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleHeading({ level: 4 }).run();
                      setHeadingOpen(false);
                    }}
                  >
                    <Heading4 size={16} /> Heading 4
                  </button>
                </div>
              )}
            </div>

            {/* List Dropdown */}
            <div className="relative">
              <button
                className="p-2 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
                title="List"
                onClick={() => {
                  setListOpen(!listOpen);
                  setHeadingOpen(false);
                }}
              >
                <List size={16} />
                <ChevronDown size={12} />
              </button>
              {listOpen && (
                <div
                  className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] ${
                    isDark
                      ? "bg-neutral-800 border border-neutral-700"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("bulletList") ? "text-[#F25C54]" : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleBulletList().run();
                      setListOpen(false);
                    }}
                  >
                    <List size={16} /> Bullet
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${
                      editor?.isActive("orderedList") ? "text-[#F25C54]" : ""
                    }`}
                    onClick={() => {
                      editor?.chain().focus().toggleOrderedList().run();
                      setListOpen(false);
                    }}
                  >
                    <ListOrdered size={16} /> Ordered
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                      isDark
                        ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    } ${editor?.isActive("taskList") ? "text-[#F25C54]" : ""}`}
                    onClick={() => {
                      editor?.chain().focus().toggleTaskList().run();
                      setListOpen(false);
                    }}
                  >
                    <ListChecks size={16} /> Task
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("blockquote")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Quote"
            >
              <Quote size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("codeBlock")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Code"
            >
              <Code size={16} />
            </button>

            <div
              className={`w-px h-4 mx-1 ${
                isDark ? "bg-neutral-700" : "bg-neutral-200"
              }`}
            />

            {/* Text Formatting */}
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("bold")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("italic")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("strike")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded transition-colors ${
                editor?.isActive("underline")
                  ? "bg-[#F25C54]/20 text-[#F25C54]"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title="Underline"
            >
              <Underline size={16} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <main
          className="flex-1 overflow-y-auto py-8 px-12 cursor-text"
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
