import { EditorContent } from "@tiptap/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Folder } from "lucide-react";
import { useNotes } from "./hooks/useNotes";
import "./index.css";

// Components
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { EditorToolbar } from "./components/Editor/EditorToolbar";
import { UpdateModal } from "./components/UpdateModal";
import { CommandPalette } from "./components/CommandPalette";
import { ExportMenu } from "./components/ExportMenu";
import { SettingsMenu } from "./components/SettingsMenu";
import { useSettings } from "./hooks/useSettings";
import { PAPER_WIDTHS, ZOOM_STEP } from "./utils/settings";

// Hooks
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useEditorConfig } from "./hooks/useEditorConfig";

function App() {
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

  // Editor Configuration
  const editor = useEditorConfig();

  // Notes management
  const {
    notes,
    folders,
    activeNote,
    activeNoteId,
    isLoaded,
    loadError,
    saveError,
    clearSaveError,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    renameNote,
    togglePinNote,
    createFolder,
    renameFolder,
    deleteFolder,
    moveNote,
  } = useNotes();

  // Settings + paper zoom
  const { settings, update, zoomBy, resetZoom, reset } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [zoomHint, setZoomHint] = useState<number | null>(null);
  const zoomHintTimer = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const showZoomHint = useCallback((value: number) => {
    setZoomHint(value);
    if (zoomHintTimer.current) window.clearTimeout(zoomHintTimer.current);
    zoomHintTimer.current = window.setTimeout(() => setZoomHint(null), 1200);
  }, []);

  // Show the zoom percentage whenever it changes (wheel, shortcuts or the slider)
  const lastZoom = useRef(settings.paperZoom);
  useEffect(() => {
    if (lastZoom.current !== settings.paperZoom) {
      lastZoom.current = settings.paperZoom;
      showZoomHint(settings.paperZoom);
    }
  }, [settings.paperZoom, showZoomHint]);

  // Ctrl + scroll over the paper zooms it (needs a non-passive listener to stop page zoom)
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      acc += -e.deltaY * 0.05; // one mouse notch = 5%, trackpad pinch accumulates
      const whole = Math.trunc(acc);
      if (whole !== 0) {
        zoomBy(whole);
        acc -= whole;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy, isLoaded]);

  useEffect(() => {
    editor?.view.dom.setAttribute("spellcheck", String(settings.spellcheck));
  }, [editor, settings.spellcheck]);

  // Ctrl + / Ctrl - / Ctrl 0
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomBy(-ZOOM_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomBy, resetZoom]);

  // Command palette (Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const folderNameOf = (id?: string | null) =>
    folders.find((f) => f.id === id)?.name ?? "Inbox";

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
    }, settings.autosaveDelay);
  }, [editor, activeNoteId, updateNote, settings.autosaveDelay]);

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

  if (loadError) {
    return (
      <div className="flex w-full h-screen items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-lg font-semibold mb-2">Raku couldn't open your notes</h1>
          <p className="text-sm opacity-70 mb-4">
            Your data has not been modified. Try restarting the app. If this
            keeps happening, please report it with the details below.
          </p>
          <pre className="text-xs opacity-60 whitespace-pre-wrap break-words">{loadError}</pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full h-screen overflow-hidden ${
        isDark ? "dark" : ""
      } bg-app-main text-app-text transition-colors duration-200`}
    >
      {saveError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-600 text-white text-sm shadow-lg flex items-center gap-3 raku-rise">
          <span>{saveError}</span>
          <button onClick={clearSaveError} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Update Available Modal */}
      <UpdateModal
        updateAvailable={updateAvailable}
        setUpdateAvailable={setUpdateAvailable}
        isUpdating={isUpdating}
        isDark={isDark}
      />

      {/* Sidebar (Hidden in Zen Mode) */}
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ width: !zenMode && sidebarOpen ? "18.125rem" : 0 }}
        aria-hidden={zenMode || !sidebarOpen}
        inert={zenMode || !sidebarOpen}
      >
        <Sidebar
          notes={notes}
          folders={folders}
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
          moveNote={moveNote}
          createFolder={createFolder}
          renameFolder={renameFolder}
          deleteFolder={deleteFolder}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full relative bg-app-tertiary/40">
        {/* Zen Mode Exit Banner */}
        {zenMode && (
          <div className="fixed top-4 right-6 z-50 raku-fade">
            <button
              onClick={() => setZenMode(false)}
              className="px-3 py-1.5 rounded-full backdrop-blur-md bg-app-toolbar border border-app-border text-xs text-app-muted hover:text-accent shadow-lg transition-all flex items-center gap-1.5 group cursor-pointer hover:scale-105"
              title="Exit Zen Mode (Esc or Ctrl+Shift+Z)"
            >
              <span className="font-semibold text-accent">Exit Zen Mode</span>
              <span className="text-[0.625rem] opacity-60 font-mono bg-app-tertiary px-1.5 py-0.5 rounded ml-1">Esc</span>
            </button>
          </div>
        )}

        {!zenMode && (
          <Header
            isDark={isDark}
            setIsDark={setIsDark}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            zenMode={zenMode}
            setZenMode={setZenMode}
            settingsMenu={
              <SettingsMenu
                open={isSettingsOpen}
                setOpen={setIsSettingsOpen}
                settings={settings}
                update={update}
                resetZoom={resetZoom}
                reset={reset}
                isDark={isDark}
                setIsDark={setIsDark}
                currentTheme={currentTheme}
                setCurrentTheme={setCurrentTheme}
                version={__APP_VERSION__}
              />
            }
            exportMenu={
              <ExportMenu
                open={isExportOpen}
                setOpen={setIsExportOpen}
                activeNote={activeNote}
                editor={editor}
              />
            }
            crumbs={["Notes", folderNameOf(activeNote?.folderId), activeNote?.title || "Untitled"]}
          />
        )}

        {/* Formatting toolbar: lives outside the writing sheet (hidden in Zen Mode) */}
        {!zenMode && <EditorToolbar editor={editor} isDark={isDark} />}

        {/* Editor sheet */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-6 pb-16 cursor-text"
          onClick={() => {
            // Focus editor when clicking on the main area
            editor?.chain().focus().run();
          }}
        >
          <div
            style={{
              ["--zoom" as string]: settings.paperZoom / 100,
              ["--raku-line-height" as string]: settings.lineHeight,
              maxWidth:
                PAPER_WIDTHS[settings.paperWidth] === null
                  ? "none"
                  : `min(100%, ${(PAPER_WIDTHS[settings.paperWidth] as number) * (settings.paperZoom / 100)}px)`,
            }}
            className={`mx-auto w-full rounded-[24px] transition-[box-shadow,background-color,border-color] duration-300 ${
              zenMode
                ? "mt-16"
                : "bg-app-main border border-app-border shadow-[0_18px_44px_-12px_rgba(0,0,0,0.16)]"
            }`}
          >
            <div className="px-6 sm:px-14 pt-9 pb-14">
              {activeNote && settings.showNoteInfo && (
                <div
                  key={activeNote.id}
                  className="flex flex-wrap items-center gap-2.5 mb-2 text-[0.71875rem] font-mono text-app-muted raku-fade"
                >
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-muted text-accent font-medium">
                    <Folder size={12} />
                    {folderNameOf(activeNote.folderId)}
                  </span>
                  <span>
                    Edited{" "}
                    {new Date(activeNote.updatedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>

      </div>

      {zoomHint !== null && (
        <div
          key={zoomHint}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-app-text text-app-main text-xs font-mono tabular-nums shadow-lg raku-fade pointer-events-none"
        >
          {zoomHint}%
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        notes={notes}
        folders={folders}
        onSelectNote={handleSelectNote}
        onNewNote={() => createNote(null)}
        onNewFolder={() => createFolder("New folder")}
        onToggleTheme={() => setIsDark(!isDark)}
        onZen={() => setZenMode(true)}
        onExport={() => setIsExportOpen(true)}
      />
    </div>
  );
}

export default App;
