import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  FolderPlus,
  Moon,
  Maximize2,
  Download,
} from "lucide-react";
import type { ReactNode } from "react";
import { Note, Folder } from "../hooks/useNotes";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  folders: Folder[];
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onNewFolder: () => void;
  onToggleTheme: () => void;
  onZen: () => void;
  onExport: () => void;
}

interface Item {
  key: string;
  label: string;
  hint: string;
  icon: ReactNode;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  notes,
  folders,
  onSelectNote,
  onNewNote,
  onNewFolder,
  onToggleTheme,
  onZen,
  onExport,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const folderName = (id?: string | null) =>
      folders.find((f) => f.id === id)?.name ?? "Inbox";

    const noteItems: Item[] = notes
      .filter((n) => !q || (n.title || "Untitled").toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8)
      .map((n) => ({
        key: n.id,
        label: n.title || "Untitled",
        hint: folderName(n.folderId),
        icon: <FileText size={16} />,
        run: () => onSelectNote(n.id),
      }));

    const actions: Item[] = [
      {
        key: "a-note",
        label: "New note",
        hint: "",
        icon: <Plus size={16} />,
        run: onNewNote,
      },
      {
        key: "a-folder",
        label: "New folder",
        hint: "",
        icon: <FolderPlus size={16} />,
        run: onNewFolder,
      },
      {
        key: "a-theme",
        label: "Toggle light / dark",
        hint: "",
        icon: <Moon size={16} />,
        run: onToggleTheme,
      },
      {
        key: "a-zen",
        label: "Zen mode",
        hint: "Ctrl+Shift+Z",
        icon: <Maximize2 size={16} />,
        run: onZen,
      },
      {
        key: "a-export",
        label: "Export note",
        hint: ".md / PDF",
        icon: <Download size={16} />,
        run: onExport,
      },
    ].filter((a) => !q || a.label.toLowerCase().includes(q));

    return [...noteItems, ...actions];
  }, [
    query,
    notes,
    folders,
    onSelectNote,
    onNewNote,
    onNewFolder,
    onToggleTheme,
    onZen,
    onExport,
  ]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  if (!open) return null;

  const runItem = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div
      className="fixed inset-0 z-200 flex justify-center pt-[14vh] bg-app-main/50 backdrop-blur-sm raku-fade"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-[min(35rem,calc(100%-2rem))] self-start rounded-2xl border border-app-border bg-app-dropdown backdrop-blur-xl shadow-2xl overflow-hidden raku-pop"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") runItem(items[index]);
          }}
          placeholder="Search notes or run a command"
          aria-label="Search notes or run a command"
          className="w-full px-5 py-4 bg-transparent text-app-text text-base outline-none border-b border-app-border placeholder:text-app-muted"
        />
        <ul className="max-h-85 overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-3 py-3 text-sm text-app-muted">No results</li>
          )}
          {items.map((item, i) => (
            <li key={item.key}>
              <button
                onClick={() => runItem(item)}
                onMouseMove={() => setIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  i === index
                    ? "bg-accent-muted text-app-text"
                    : "text-app-muted"
                }`}
              >
                <span className={i === index ? "text-accent" : ""}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-[0.6875rem] font-mono text-app-muted">
                  {item.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
