import { PanelLeftClose, Plus, Pencil, Trash2 } from "lucide-react";
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
  version,
}: SidebarProps) {
  return (
    <aside
      className={`w-[280px] shrink-0 flex flex-col border-r transition-all ${
        isDark ? "border-[#262626] bg-[#0A0A0A]" : "border-neutral-200 bg-white"
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
        <nav className="space-y-4">
          {Object.entries(
            [...notes]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .reduce((groups, note) => {
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
              <div
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-neutral-600" : "text-neutral-400"
                }`}
              >
                {date}
              </div>
              {dateNotes.map((note) => (
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
        v.{version}
      </div>
    </aside>
  );
}
