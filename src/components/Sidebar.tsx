import { PanelLeftClose, Plus, Pencil, Trash2, Pin } from "lucide-react";
import { Note } from "../hooks/useNotes";

interface SidebarProps {
  isDark: boolean;
  notes: Note[];
  activeNoteId: string | null;
  renamingNoteId: string | null;
  renameValue: string;
  setSidebarOpen: (open: boolean) => void;
  createNote: () => void;
  handleSelectNote: (id: string) => void;
  setRenameValue: (value: string) => void;
  setRenamingNoteId: (id: string | null) => void;
  renameNote: (id: string, value: string) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  version: string;
}

export function Sidebar({
  isDark,
  notes,
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
  version,
}: SidebarProps) {
  const pinnedNotes = notes
    .filter((n) => n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const unpinnedNotes = notes
    .filter((n) => !n.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const renderNoteItem = (note: Note) => (
    <div key={note.id} className="group flex items-center gap-0.5">
      <button
        onClick={() => handleSelectNote(note.id)}
        className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors truncate flex items-center gap-1.5 ${
          note.id === activeNoteId
            ? "bg-app-tertiary text-app-text font-semibold shadow-xs"
            : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
        }`}
      >
        {note.isPinned && (
          <Pin size={12} className="text-accent shrink-0 fill-accent/20" />
        )}
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
            className="w-full bg-transparent border-b outline-none border-accent text-app-text"
          />
        ) : (
          <span className="truncate">{note.title || "Untitled"}</span>
        )}
      </button>

      {/* Pin / Unpin Button */}
      <button
        onClick={() => togglePinNote(note.id)}
        className={`p-1 rounded transition-all ${
          note.isPinned
            ? "opacity-100 text-accent hover:opacity-80"
            : "opacity-0 group-hover:opacity-100 text-app-muted hover:text-accent"
        }`}
        title={note.isPinned ? "Unpin Note" : "Pin Note to Top"}
      >
        <Pin size={12} className={note.isPinned ? "fill-accent" : ""} />
      </button>

      {/* Rename Button */}
      <button
        onClick={() => {
          setRenameValue(note.title || "");
          setRenamingNoteId(note.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all text-app-muted hover:text-accent"
        title="Rename"
      >
        <Pencil size={12} />
      </button>

      {/* Delete Button */}
      <button
        onClick={() => deleteNote(note.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all text-app-muted hover:text-red-500"
        title="Delete"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );

  return (
    <aside className="w-[280px] shrink-0 flex flex-col border-r transition-colors duration-200 bg-app-sidebar border-app-border">
      {/* Sidebar Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm bg-app-tertiary">
            <svg
              className="w-5 h-5 text-[#F25C54]"
              viewBox="0 0 64 64"
              fill="none"
            >
              {/* Top curved bar */}
              <path
                d="M4 12 C4 8, 32 4, 60 12"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Horizontal beam */}
              <rect
                x="8"
                y="16"
                width="48"
                height="4"
                rx="1"
                fill="currentColor"
              />
              {/* Left pillar */}
              <rect
                x="12"
                y="20"
                width="6"
                height="40"
                rx="1"
                fill="currentColor"
              />
              {/* Right pillar */}
              <rect
                x="46"
                y="20"
                width="6"
                height="40"
                rx="1"
                fill="currentColor"
              />
              {/* Left top block */}
              <rect
                x="10"
                y="14"
                width="10"
                height="6"
                rx="1"
                fill="currentColor"
              />
              {/* Right top block */}
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
          <h1 className="text-xs font-bold tracking-widest text-app-muted">
            RAKU
          </h1>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-md transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
          title="Hide Sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Notes Section */}
      <div className="px-6 py-2 flex-1 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide uppercase text-app-muted">
            Notes
          </span>
          <button
            onClick={() => createNote()}
            className="p-1 rounded transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
            title="New Note"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* PINNED SECTION */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1 opacity-90">
              <Pin size={10} className="fill-accent" />
              <span>Pinned</span>
            </div>
            <div className="space-y-1">
              {pinnedNotes.map(renderNoteItem)}
            </div>
          </div>
        )}

        {/* ALL / REGULAR NOTES BY DATE */}
        <nav className="space-y-4">
          {Object.entries(
            unpinnedNotes.reduce((groups, note) => {
              const date = new Date(note.updatedAt).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                }
              );
              if (!groups[date]) groups[date] = [];
              groups[date].push(note);
              return groups;
            }, {} as Record<string, Note[]>)
          ).map(([date, dateNotes]) => (
            <div key={date} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-app-muted opacity-80">
                {date}
              </div>
              {dateNotes.map(renderNoteItem)}
            </div>
          ))}
        </nav>
      </div>

      {/* Version Footer */}
      <div className="p-4 text-center text-[10px] font-mono opacity-50 text-app-muted">
        v.{version}
      </div>
    </aside>
  );
}
