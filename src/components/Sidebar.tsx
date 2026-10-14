import { useRef, useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Pin,
  ChevronRight,
  FolderPlus,
  FolderInput,
  Search,
  PanelLeftClose,
  FilePlus2,
  FileText,
} from "lucide-react";
import { Note, Folder } from "../hooks/useNotes";
import logo from "../assets/logo.svg";

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  renamingNoteId: string | null;
  renameValue: string;
  setSidebarOpen: (open: boolean) => void;
  createNote: (folderId?: string | null) => void;
  handleSelectNote: (id: string) => void;
  setRenameValue: (value: string) => void;
  setRenamingNoteId: (id: string | null) => void;
  renameNote: (id: string, value: string) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  moveNote: (id: string, folderId: string | null) => void;
  createFolder: (name: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  onOpenPalette: () => void;
}

const formatNoteDate = (ts: number) => {
  const d = new Date(ts);
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0 && new Date().getDate() === d.getDate())
    return `Today ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (days <= 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const smallBtn =
  "p-1 rounded-md transition-all text-app-muted hover:text-accent hover:bg-app-tertiary";

const sectionLabel =
  "px-3 pt-3 pb-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-app-muted";

export function Sidebar({
  notes,
  folders,
  activeNoteId,
  renamingNoteId,
  renameValue,
  setSidebarOpen,
  createNote,
  handleSelectNote,
  setRenameValue,
  setRenamingNoteId,
  renameNote,
  deleteNote,
  togglePinNote,
  moveNote,
  createFolder,
  renameFolder,
  deleteFolder,
  onOpenPalette,
}: SidebarProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem("raku-open-folders") || "{}");
      } catch {
        return {};
      }
    },
  );
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderRename, setFolderRename] = useState("");
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // ---- Pointer-based drag & drop (works regardless of the webview's HTML5 DnD support) ----
  const [drag, setDrag] = useState<{
    id: string;
    title: string;
    x: number;
    y: number;
  } | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    sx: number;
    sy: number;
    active: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const hoverTimerRef = useRef<number | null>(null);
  const openFoldersRef = useRef(openFolders);
  openFoldersRef.current = openFolders;

  const findTarget = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return el?.closest<HTMLElement>("[data-drop]")?.dataset.drop ?? null;
  };

  const startPointerDrag = (e: React.PointerEvent, note: Note) => {
    if (e.button !== 0 || renamingNoteId === note.id) return;
    dragRef.current = {
      id: note.id,
      sx: e.clientX,
      sy: e.clientY,
      active: false,
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("raku-dragging");
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
      dragRef.current = null;
      setDrag(null);
      setOverTarget(null);
    };

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.active) {
        if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 6) return;
        d.active = true;
        document.body.classList.add("raku-dragging");
      }
      setDrag({
        id: d.id,
        title: note.title || "Untitled",
        x: ev.clientX,
        y: ev.clientY,
      });
      const target = findTarget(ev.clientX, ev.clientY);
      setOverTarget((prev) => {
        if (prev !== target) {
          if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
          // Hovering a collapsed folder for a moment expands it
          if (
            target &&
            target !== "inbox" &&
            openFoldersRef.current[target] === false
          ) {
            hoverTimerRef.current = window.setTimeout(
              () => setOpenFolders((o) => ({ ...o, [target]: true })),
              600,
            );
          }
        }
        return target;
      });
    };

    const onUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (d?.active) {
        suppressClickRef.current = true;
        window.setTimeout(() => (suppressClickRef.current = false), 0);
        const target = findTarget(ev.clientX, ev.clientY);
        if (target) {
          const current = notes.find((n) => n.id === d.id);
          const next = target === "inbox" ? null : target;
          if ((current?.folderId ?? null) !== next) moveNote(d.id, next);
        }
      }
      cleanup();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") cleanup();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
  };

  useEffect(() => {
    try {
      localStorage.setItem("raku-open-folders", JSON.stringify(openFolders));
    } catch {
      // ignore
    }
  }, [openFolders]);

  useEffect(() => {
    if (!moveMenuFor) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoveMenuFor(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moveMenuFor]);

  const byRecent = (a: Note, b: Note) => b.updatedAt - a.updatedAt;
  const pinnedNotes = notes.filter((n) => n.isPinned).sort(byRecent);
  const inboxNotes = notes.filter((n) => !n.folderId).sort(byRecent);
  const isOpen = (id: string) => openFolders[id] !== false;

  const submitFolder = () => {
    if (newFolderName.trim()) createFolder(newFolderName.trim());
    setNewFolderName("");
    setAddingFolder(false);
  };

  const moveTargets: { id: string | null; name: string; color: string }[] = [
    { id: null, name: "Inbox", color: "var(--raku-text-muted)" },
    ...folders.map((f) => ({
      id: f.id as string | null,
      name: f.name,
      color: f.color,
    })),
  ];

  // Drop-zone styling: every valid target gets a faint dashed outline while dragging,
  // the hovered one fills with the accent. The note's own container is not a target.
  const dragNote = drag ? notes.find((n) => n.id === drag.id) : undefined;
  const dragHome = dragNote?.folderId ?? "inbox";
  const zoneClass = (id: string) => {
    if (!drag || id === dragHome) return "";
    return overTarget === id
      ? "bg-accent-muted outline outline-[1.5px] outline-accent"
      : "outline outline-1 outline-dashed outline-app-border";
  };

  const renderNoteItem = (note: Note) => {
    // While dragging, the open note drops its highlight so only the drop zones stand out
    const active = note.id === activeNoteId && !drag;
    const isDragged = drag?.id === note.id;
    return (
      <div key={note.id} className="group relative flex items-center gap-0.5">
        <button
          onPointerDown={(e) => startPointerDrag(e, note)}
          onClick={() => {
            if (suppressClickRef.current) return;
            handleSelectNote(note.id);
          }}
          className={`flex-1 min-w-0 text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
            isDragged
              ? "opacity-40 outline outline-1 outline-dashed outline-app-border "
              : ""
          }${
            active
              ? "bg-app-main text-accent font-semibold ring-1 ring-app-border shadow-sm"
              : "text-app-muted hover:bg-app-main/60 hover:text-app-text"
          }`}
        >
          {note.isPinned && (
            <Pin size={12} className="text-accent shrink-0 fill-accent" />
          )}
          {renamingNoteId === note.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim()) renameNote(note.id, renameValue.trim());
                setRenamingNoteId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (renameValue.trim())
                    renameNote(note.id, renameValue.trim());
                  setRenamingNoteId(null);
                } else if (e.key === "Escape") {
                  setRenamingNoteId(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full bg-transparent border-b outline-none border-accent text-app-text"
            />
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block truncate">{note.title || "Untitled"}</span>
              <span className="block truncate text-[0.71875rem] font-normal text-app-muted">
                {formatNoteDate(note.updatedAt)}
              </span>
            </span>
          )}
        </button>

        <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 in-[.raku-dragging]:hidden bg-app-sidebar/90 backdrop-blur rounded-lg px-0.5">
          <button
            onClick={() => togglePinNote(note.id)}
            className={smallBtn}
            title={note.isPinned ? "Unpin" : "Pin to top"}
          >
            <Pin
              size={12}
              className={note.isPinned ? "fill-accent text-accent" : ""}
            />
          </button>
          <button
            onClick={() =>
              setMoveMenuFor(moveMenuFor === note.id ? null : note.id)
            }
            className={smallBtn}
            title="Move to folder"
          >
            <FolderInput size={12} />
          </button>
          <button
            onClick={() => {
              setRenameValue(note.title || "");
              setRenamingNoteId(note.id);
            }}
            className={smallBtn}
            title="Rename"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className={`${smallBtn} hover:!text-red-500`}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {moveMenuFor === note.id && (
          <div
            ref={menuRef}
            className="absolute right-1 top-full mt-1 z-50 min-w-[10.625rem] p-1.5 rounded-xl border border-app-border bg-app-dropdown backdrop-blur-xl shadow-2xl text-xs raku-pop"
          >
            <div className="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-app-muted">
              Move to
            </div>
            {moveTargets.map((f) => (
              <button
                key={f.id ?? "inbox"}
                onClick={() => {
                  moveNote(note.id, f.id);
                  setMoveMenuFor(null);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-app-tertiary ${
                  (note.folderId ?? null) === f.id
                    ? "text-accent font-semibold"
                    : "text-app-text"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-[3px] shrink-0"
                  style={{ background: f.color }}
                />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-[18.125rem] shrink-0 flex flex-col border-r transition-colors duration-200 bg-app-sidebar border-app-border">
      {/* Brand */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <img
          src={logo}
          alt="Raku"
          className="w-9 h-9 rounded-full transition-transform duration-500 hover:rotate-[-8deg] hover:scale-110"
          draggable={false}
        />

        <button
          onClick={() => setSidebarOpen(false)}
          className={`${smallBtn} ml-auto`}
          title="Hide sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 pb-2 grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={() => createNote(null)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-app-text text-app-main text-sm font-medium transition-transform hover:-translate-y-px"
        >
          <Plus size={16} /> New note
        </button>
        <button
          onClick={() => setAddingFolder(true)}
          className="w-11 flex items-center justify-center rounded-xl border border-app-border bg-app-main text-app-muted transition-all hover:text-accent hover:border-accent"
          title="New folder"
          aria-label="New folder"
        >
          <FolderPlus size={16} />
        </button>
      </div>
      <button
        onClick={onOpenPalette}
        className="mx-4 mb-2 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-app-border bg-app-main text-app-muted text-[0.8125rem] hover:border-app-muted transition-colors"
      >
        <Search size={14} />
        Search or jump to
        <kbd className="ml-auto text-[0.625rem] font-mono px-1.5 py-0.5 rounded border border-app-border">
          Ctrl K
        </kbd>
      </button>

      {/* List */}
      <div
        className={`flex-1 overflow-y-auto px-3 pb-3 space-y-1 ${
          drag ? "[&_button]:pointer-events-none" : ""
        }`}
      >
        {pinnedNotes.length > 0 && (
          <section>
            <div className={sectionLabel}>Pinned</div>
            <div className="space-y-0.5">{pinnedNotes.map(renderNoteItem)}</div>
          </section>
        )}

        <section>
          <div className={sectionLabel}>Folders</div>

          {addingFolder && (
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={submitFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitFolder();
                if (e.key === "Escape") {
                  setNewFolderName("");
                  setAddingFolder(false);
                }
              }}
              placeholder="Folder name"
              className="w-full mb-1 px-3 py-2 rounded-xl text-sm bg-app-main text-app-text border-[1.5px] border-accent outline-none"
            />
          )}

          {folders.length === 0 && !addingFolder && (
            <p className="px-3 py-1 text-xs text-app-muted">
              No folders yet. Use the folder button to create one.
            </p>
          )}

          {folders.map((folder) => {
            const items = notes
              .filter((n) => n.folderId === folder.id)
              .sort(byRecent);
            const open = isOpen(folder.id);
            const confirming = pendingDeleteFolder === folder.id;
            return (
              <div
                key={folder.id}
                data-drop={folder.id}
                className={`mb-0.5 rounded-xl transition-[background-color,outline-color] duration-150 ${zoneClass(folder.id)}`}
              >
                <div className="group relative flex items-center">
                  <button
                    onClick={() =>
                      setOpenFolders((p) => ({ ...p, [folder.id]: !open }))
                    }
                    className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-app-text hover:bg-app-main/60 transition-colors"
                    aria-expanded={open}
                  >
                    <ChevronRight
                      size={14}
                      className={`text-app-muted transition-transform duration-200 ${
                        open ? "rotate-90" : ""
                      }`}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                      style={{ background: folder.color }}
                    />
                    {renamingFolderId === folder.id ? (
                      <input
                        autoFocus
                        value={folderRename}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setFolderRename(e.target.value)}
                        onBlur={() => {
                          renameFolder(folder.id, folderRename);
                          setRenamingFolderId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            renameFolder(folder.id, folderRename);
                            setRenamingFolderId(null);
                          } else if (e.key === "Escape") {
                            setRenamingFolderId(null);
                          }
                        }}
                        className="w-full bg-transparent border-b outline-none border-accent"
                      />
                    ) : (
                      <span className="truncate flex-1 text-left">
                        {folder.name}
                      </span>
                    )}
                    <span className="text-[0.6875rem] font-mono text-app-muted group-hover:opacity-0">
                      {items.length}
                    </span>
                  </button>
                  <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 in-[.raku-dragging]:hidden">
                    <button
                      onClick={() => createNote(folder.id)}
                      className={smallBtn}
                      title="New note in folder"
                    >
                      <FilePlus2 size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setFolderRename(folder.name);
                        setRenamingFolderId(folder.id);
                      }}
                      className={smallBtn}
                      title="Rename folder"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirming) {
                          deleteFolder(folder.id);
                          setPendingDeleteFolder(null);
                        } else {
                          setPendingDeleteFolder(folder.id);
                          setTimeout(
                            () =>
                              setPendingDeleteFolder((c) =>
                                c === folder.id ? null : c,
                              ),
                            2500,
                          );
                        }
                      }}
                      className={`${smallBtn} ${
                        confirming ? "!text-red-500" : "hover:!text-red-500"
                      }`}
                      title={
                        confirming
                          ? "Click again to delete (notes move to Inbox)"
                          : "Delete folder (notes move to Inbox)"
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden pl-4">
                    {items.length === 0 ? (
                      <p className="px-3 py-1.5 text-xs text-app-muted">
                        Empty folder
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {items.map(renderNoteItem)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {(inboxNotes.length > 0 || drag) && (
          <section
            data-drop="inbox"
            className={`rounded-xl transition-[background-color,outline-color] duration-150 ${zoneClass("inbox")}`}
          >
            <div className={sectionLabel}>Inbox</div>
            <div className="space-y-0.5 min-h-8">
              {inboxNotes.map(renderNoteItem)}
              {drag && inboxNotes.length === 0 && (
                <p className="px-3 py-1.5 text-xs text-app-muted">
                  Drop here to remove from folder
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {drag && (
        <div
          className="fixed z-[300] pointer-events-none flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-2xl text-sm font-medium bg-app-main/90 backdrop-blur-md text-app-text border border-accent/60 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.45)] max-w-64 raku-fade"
          style={{
            left: drag.x + 16,
            top: drag.y + 12,
            transform: "rotate(-2deg)",
          }}
        >
          <FileText size={14} className="text-accent shrink-0" />
          <span className="truncate">{drag.title}</span>
        </div>
      )}
    </aside>
  );
}
