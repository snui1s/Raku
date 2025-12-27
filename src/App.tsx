import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImage } from "./components/ResizableImage";
import UnderlineExtension from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { saveImage } from "./utils/imageUtils";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "./hooks/useNotes";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Extension } from "@tiptap/core";
import Dropcursor from "@tiptap/extension-dropcursor";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
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
  PanelLeftClose,
  PanelLeft,
  Pencil,
  Highlighter,
  Palette,
} from "lucide-react";
import confetti from "canvas-confetti";
import { check } from "@tauri-apps/plugin-updater";
import "./index.css";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme state
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Rename modal state
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Dropdown states
  const [headingOpen, setHeadingOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);

  // Pastel Color Palette
  const PASTEL_COLORS = [
    { color: "#FFADAD", name: "Red" },
    { color: "#FFD6A5", name: "Orange" },
    { color: "#FDFFB6", name: "Yellow" },
    { color: "#CAFFBF", name: "Green" },
    { color: "#9BF6FF", name: "Cyan" },
    { color: "#A0C4FF", name: "Blue" },
    { color: "#BDB2FF", name: "Purple" },
    { color: "#FFC6FF", name: "Pink" },
  ];

  // Pomodoro state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Auto-Update state
  const [updateAvailable, setUpdateAvailable] = useState<{
    version: string;
    notes: string;
    downloadAndInstall: () => Promise<void>;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check for updates on app start
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update?.available) {
          setUpdateAvailable({
            version: update.version,
            notes: update.body || "New version available!",
            downloadAndInstall: async () => {
              setIsUpdating(true);
              await update.downloadAndInstall();
              // App will restart automatically after install
            },
          });
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };
    checkForUpdates();
  }, []);

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
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      ListItem,
      Dropcursor.configure({
        color: "#F25C54", // Accent color
        width: 2,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      // Custom Behavior Extension
      Extension.create({
        name: "customBehavior",
        addKeyboardShortcuts() {
          return {
            Enter: ({ editor }) => {
              // 1. Enter in Highlight Mode -> Split and Remove Highlight
              if (editor.isActive("highlight")) {
                return editor.chain().splitBlock().unsetHighlight().run();
              }

              // 2. Double Enter to Reset Color
              // If we are on an empty line (content size 0) and have a custom color
              const { empty, $anchor } = editor.state.selection;
              const isNodeEmpty = $anchor.parent.content.size === 0;
              const hasColor = editor.getAttributes("textStyle").color;

              if (empty && isNodeEmpty && hasColor) {
                return editor.chain().unsetColor().run();
              }

              return false; // Let other extensions handle Enter (like Lists)
            },
          };
        },
      }),
      BulletList.extend({
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();
              if (!empty || !isAtStart) return false;
              if (this.editor.isActive("bulletList")) {
                const parent = $anchor.parent;
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("listItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => editor.commands.splitListItem("listItem"),
          };
        },
      }),
      OrderedList.extend({
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();
              if (!empty || !isAtStart) return false;
              if (this.editor.isActive("orderedList")) {
                const parent = $anchor.parent;
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("listItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => editor.commands.splitListItem("listItem"),
          };
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      UnderlineExtension,
      TaskList,
      TaskItem.extend({
        addInputRules() {
          return [];
        },
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();

              if (!empty || !isAtStart) return false;

              if (this.editor.isActive("taskItem")) {
                const parent = $anchor.parent;
                // If the item (paragraph inside taskItem) is empty
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("taskItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => {
              // Explicitly ensure Enter splits the list item
              return editor.commands.splitListItem("taskItem");
            },
          };
        },
      }).configure({
        nested: true,
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
            },
            height: {
              default: null,
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImage);
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        spellCheck: "false",
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none prose-neutral dark:prose-invert`,
      },

      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const item = items.find((item) => item.type.startsWith("image"));

        if (item) {
          event.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            saveImage(blob)
              .then((url) => {
                const imageNode = view.state.schema.nodes.image.create({
                  src: url,
                });
                const transaction =
                  view.state.tr.replaceSelectionWith(imageNode);
                view.dispatch(transaction);
              })
              .catch((err) => {
                console.error("Failed to save image:", err);
                alert(
                  "Failed to save image. Make sure you are running with 'bun tauri dev' to enable file system access."
                );
              });
          }
          return true;
        }
        return false;
      },
      handleDrop: (view, event, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files.length > 0
        ) {
          const files = Array.from(event.dataTransfer.files);
          const imageFile = files.find((file) => file.type.startsWith("image"));

          if (imageFile) {
            event.preventDefault();

            // Get coordinates for the drop
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            saveImage(imageFile)
              .then((url) => {
                const imageNode = view.state.schema.nodes.image.create({
                  src: url,
                });

                const transaction = view.state.tr.insert(
                  coordinates?.pos ?? view.state.selection.anchor,
                  imageNode
                );
                view.dispatch(transaction);
              })
              .catch((err) => {
                console.error("Failed to save image:", err);
              });
            return true;
          }
        }
        return false;
      },
    },
    autofocus: true,
  });

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
    renameNote,
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
  // Attach editor update listener
  useEffect(() => {
    if (editor) {
      editor.on("update", handleEditorUpdate);
      return () => {
        editor.off("update", handleEditorUpdate);
      };
    }
  }, [editor, handleEditorUpdate]);

  // FIX: Save Immediately on Window Close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeNoteId && editor) {
        // Force synchronous update (or best effort async)
        const content = JSON.stringify(editor.getJSON());
        updateNote(activeNoteId, content);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeNoteId, editor, updateNote]);

  // FIX: Save Immediately on Note Switch
  const handleSelectNote = (id: string) => {
    if (activeNoteId && editor) {
      // Flush pending changes before switching
      updateNote(activeNoteId, JSON.stringify(editor.getJSON()));
    }
    selectNote(id);
  };

  // Load note content when switching notes
  useEffect(() => {
    if (editor && activeNote) {
      try {
        const content = activeNote.content
          ? JSON.parse(activeNote.content)
          : { type: "doc", content: [] };

        // Only set content if it's different to prevent loop?
        // Tiptap handles this well usually, but rigorous check is safer.
        // For now, just set it.
        editor.commands.setContent(content);
      } catch {
        editor.commands.setContent("");
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent("");
    }
  }, [editor, activeNoteId]); // Only trigger on activeNoteId change

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
        isDark ? "dark" : ""
      } ${isDark ? "bg-[#0A0A0A] text-[#E5E5E5]" : "bg-white text-[#171717]"}`}
    >
      {/* Update Available Modal */}
      {updateAvailable && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 ${
              isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
            }`}
          >
            <h2 className="text-lg font-bold mb-2">🎉 มีอัพเดทใหม่!</h2>
            <p className="text-sm opacity-70 mb-4">
              เวอร์ชั่น {updateAvailable.version} พร้อมให้ดาวน์โหลดแล้ว
            </p>
            <p className="text-xs opacity-50 mb-4">{updateAvailable.notes}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setUpdateAvailable(null)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? "bg-neutral-800 hover:bg-neutral-700"
                    : "bg-neutral-100 hover:bg-neutral-200"
                }`}
              >
                ไว้ทีหลัง
              </button>
              <button
                onClick={updateAvailable.downloadAndInstall}
                disabled={isUpdating}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-[#F25C54] text-white hover:bg-[#e04a42] transition-colors disabled:opacity-50"
              >
                {isUpdating ? "กำลังอัพเดท..." : "อัพเดทเลย"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <aside
          className={`w-[280px] shrink-0 flex flex-col border-r transition-all ${
            isDark
              ? "border-[#262626] bg-[#0A0A0A]"
              : "border-neutral-200 bg-white"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm ${
                  isDark ? "bg-neutral-800" : "bg-neutral-100"
                }`}
              >
                <svg
                  className="w-5 h-5 text-[#F25C54]"
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
              </div>
              <h1
                className={`text-xs font-bold tracking-widest ${
                  isDark ? "text-neutral-500" : "text-neutral-400"
                }`}
              >
                RAKU
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1.5 rounded-md transition-colors ${
                isDark
                  ? "text-neutral-500 hover:text-[#F25C54] hover:bg-neutral-800"
                  : "text-neutral-400 hover:text-[#F25C54] hover:bg-neutral-100"
              }`}
              title="Hide Sidebar"
            >
              <PanelLeftClose size={16} />
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
                    onClick={() => handleSelectNote(note.id)}
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
                    {renamingNoteId === note.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) {
                            renameNote(note.id, renameValue.trim());
                          }
                          setRenamingNoteId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameValue.trim()) {
                              renameNote(note.id, renameValue.trim());
                            }
                            setRenamingNoteId(null);
                          } else if (e.key === "Escape") {
                            setRenamingNoteId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className={`w-full bg-transparent border-b outline-none ${
                          isDark
                            ? "border-[#F25C54] text-white"
                            : "border-[#F25C54] text-neutral-900"
                        }`}
                      />
                    ) : (
                      note.title || "Untitled"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setRenameValue(note.title || "");
                      setRenamingNoteId(note.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                      isDark
                        ? "text-neutral-600 hover:text-[#F25C54]"
                        : "text-neutral-400 hover:text-[#F25C54]"
                    }`}
                    title="Rename"
                  >
                    <Pencil size={12} />
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

          {/* Version Footer */}
          <div
            className={`p-4 text-center text-[10px] font-mono opacity-50 ${
              isDark ? "text-neutral-500" : "text-neutral-500"
            }`}
          >
            v.{__APP_VERSION__}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header: Time + Pomodoro */}
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

            {/* Highlight Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setHighlightOpen(!highlightOpen);
                  setTextColorOpen(false); // Close others
                  setHeadingOpen(false);
                  setListOpen(false);
                }}
                className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
                  editor.isActive("highlight")
                    ? "bg-[#F25C54]/20 text-[#F25C54]"
                    : isDark
                    ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                    : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
                }`}
                title="Highlight Color"
              >
                <Highlighter size={16} />
                <ChevronDown size={12} />
              </button>

              {highlightOpen && (
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 ${
                    isDark
                      ? "bg-neutral-800 border border-neutral-700"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  {/* Unset Button */}
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setHighlightOpen(false);
                    }}
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-transform hover:scale-110 ${
                      isDark
                        ? "border-neutral-600 bg-neutral-700"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    title="Remove Highlight"
                  >
                    <div
                      className={`w-0.5 h-full rotate-45 ${
                        isDark ? "bg-red-400" : "bg-red-500"
                      }`}
                    />
                  </button>

                  <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

                  {PASTEL_COLORS.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .setHighlight({ color: swatch.color })
                          .setColor("#000000") // Force black text
                          .run();
                        setHighlightOpen(false);
                      }}
                      className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Text Color Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setTextColorOpen(!textColorOpen);
                  setHighlightOpen(false);
                  setHeadingOpen(false);
                  setListOpen(false);
                }}
                className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
                  editor.getAttributes("textStyle").color
                    ? "text-[#F25C54]"
                    : isDark
                    ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                    : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
                }`}
                title="Text Color"
              >
                <Palette size={16} />
                <ChevronDown size={12} />
              </button>

              {textColorOpen && (
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 ${
                    isDark
                      ? "bg-neutral-800 border border-neutral-700"
                      : "bg-white border border-neutral-200"
                  }`}
                >
                  {/* Unset Button */}
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setTextColorOpen(false);
                    }}
                    className={`w-6 h-6 rounded border flex items-center justify-center transition-transform hover:scale-110 ${
                      isDark
                        ? "border-neutral-600 bg-neutral-700"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    title="Default Color"
                  >
                    <span className="text-xs font-bold">A</span>
                  </button>

                  <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

                  {PASTEL_COLORS.map((swatch) => (
                    <button
                      key={swatch.color}
                      onClick={() => {
                        editor.chain().focus().setColor(swatch.color).run();
                        setTextColorOpen(false);
                      }}
                      className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    />
                  ))}

                  <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

                  {/* Custom Color Input */}
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/10 transition-transform hover:scale-110 bg-linear-to-br from-pink-400 via-purple-400 to-indigo-400">
                    <input
                      type="color"
                      onInput={(e) => {
                        editor
                          .chain()
                          .focus()
                          .setColor((e.target as HTMLInputElement).value)
                          .run();
                        // setTextColorOpen(false); // REMOVED: Keep open while picking
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Custom Color"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-neutral-700 mx-1" />

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
