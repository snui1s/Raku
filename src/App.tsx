import { EditorContent } from "@tiptap/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "./hooks/useNotes";
import "./index.css";

// Components
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { EditorToolbar } from "./components/Editor/EditorToolbar";
import { UpdateModal } from "./components/UpdateModal";
import { WordCounter } from "./components/WordCounter";
import { ExportModal } from "./components/ExportModal";

// Hooks
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useEditorConfig } from "./hooks/useEditorConfig";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme state
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem("raku-theme") || "classic";
  });

  // Zen Focus Mode state
  const [zenMode, setZenMode] = useState(false);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Keyboard shortcut Ctrl+Shift+Z or Esc to toggle/exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setZenMode((prev) => !prev);
      } else if (e.key === "Escape" && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zenMode]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("raku-theme", currentTheme);
  }, [currentTheme]);

  // Rename modal state
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Auto-Update state
  const { updateAvailable, isUpdating, setUpdateAvailable } = useAppUpdate();

  // Update clock every second (real-time)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Editor Configuration
  const editor = useEditorConfig();

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
    togglePinNote,
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

  return (
    <div
      className={`flex w-full h-screen overflow-hidden ${
        isDark ? "dark" : ""
      } bg-app-main text-app-text transition-colors duration-200`}
    >
      {/* Update Available Modal */}
      <UpdateModal
        updateAvailable={updateAvailable}
        setUpdateAvailable={setUpdateAvailable}
        isUpdating={isUpdating}
        isDark={isDark}
      />

      {/* Sidebar (Hidden in Zen Mode) */}
      {!zenMode && sidebarOpen && (
        <Sidebar
          isDark={isDark}
          notes={notes}
          activeNoteId={activeNoteId}
          renamingNoteId={renamingNoteId}
          renameValue={renameValue}
          setSidebarOpen={setSidebarOpen}
          createNote={createNote}
          handleSelectNote={handleSelectNote}
          setRenameValue={setRenameValue}
          setRenamingNoteId={setRenamingNoteId}
          renameNote={renameNote}
          deleteNote={deleteNote}
          togglePinNote={togglePinNote}
          version={__APP_VERSION__}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Zen Mode Exit Banner */}
        {zenMode && (
          <div className="fixed top-4 right-6 z-50">
            <button
              onClick={() => setZenMode(false)}
              className="px-3 py-1.5 rounded-full backdrop-blur-md bg-app-toolbar border border-app-border text-xs text-app-muted hover:text-accent shadow-lg transition-all flex items-center gap-1.5 group cursor-pointer hover:scale-105"
              title="Exit Zen Mode (Esc or Ctrl+Shift+Z)"
            >
              <span className="font-semibold text-accent">🧘 Exit Zen Mode</span>
              <span className="text-[10px] opacity-60 font-mono bg-app-tertiary px-1.5 py-0.5 rounded ml-1">Esc</span>
            </button>
          </div>
        )}

        <Header
          isDark={isDark}
          setIsDark={setIsDark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentTime={currentTime}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          zenMode={zenMode}
          setZenMode={setZenMode}
          onOpenExport={() => setIsExportOpen(true)}
        />

        {/* Floating Toolbar Island (Hidden in Zen Mode) */}
        {!zenMode && <EditorToolbar editor={editor} isDark={isDark} />}

        {/* Editor */}
        <main
          className="flex-1 overflow-y-auto py-8 px-12 cursor-text"
          onClick={() => {
            // Focus editor when clicking on the main area
            editor?.chain().focus().run();
          }}
        >
          <div className="max-w-1xl mx-auto">
            <EditorContent editor={editor} />
          </div>
        </main>

        {/* Live Word & Character Counter */}
        <WordCounter editor={editor} />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          activeNote={activeNote}
          editor={editor}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

export default App;
