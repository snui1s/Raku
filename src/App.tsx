import { EditorContent } from "@tiptap/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNotes } from "./hooks/useNotes";
import "./index.css";

// Components
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { EditorToolbar } from "./components/Editor/EditorToolbar";
import { UpdateModal } from "./components/UpdateModal";

// Hooks
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useEditorConfig } from "./hooks/useEditorConfig";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme state
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      } ${isDark ? "bg-[#0A0A0A] text-[#E5E5E5]" : "bg-white text-[#171717]"}`}
    >
      {/* Update Available Modal */}
      <UpdateModal
        updateAvailable={updateAvailable}
        setUpdateAvailable={setUpdateAvailable}
        isUpdating={isUpdating}
        isDark={isDark}
      />

      {/* Sidebar */}
      {sidebarOpen && (
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
          version={__APP_VERSION__}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <Header
          isDark={isDark}
          setIsDark={setIsDark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentTime={currentTime}
        />

        {/* Floating Toolbar Island */}
        <EditorToolbar editor={editor} isDark={isDark} />

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
      </div>
    </div>
  );
}

export default App;
