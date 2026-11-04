// Dev-only page for looking at UpdateModal without waiting for a real update.
// Open http://localhost:14200/preview-update.html while `bun run dev` or `bun run tauri dev` is running.
// It is not listed in the build inputs, so it is never shipped.
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { UpdateModal } from "../components/UpdateModal";

const THEMES = ["default", "mono", "classic", "matcha", "sakura", "ocean", "lavender", "sunset", "nordic"];

const LONG_NOTES = [
  "## What's Changed",
  "* fix(editor): keep images inside the paper when the paper shrinks",
  "* feat(ui): use Google Sans as the main font",
  "* chore: move the dev server from port 1420 to 14200",
  "* fix(search): the symbol index no longer drops notes with emoji in the title",
  "* feat(export): export a note as PDF with the paper width you chose",
  "* perf(sidebar): open folders with thousands of notes without a pause",
  "",
  "**Full Changelog**: https://github.com/snui1s/Raku/compare/v1.1.1...v1.2.0",
].join("\n");

const CASES = {
  "Short notes": "Release v1.2.0",
  "Long notes": LONG_NOTES,
  "No notes": "",
} as const;

function Preview() {
  const [theme, setTheme] = useState("default");
  const [dark, setDark] = useState(false);
  const [notesCase, setNotesCase] = useState<keyof typeof CASES>("Short notes");
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    if (theme === "default") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme, dark]);

  const update = open
    ? {
        version: "1.2.0",
        notes: CASES[notesCase],
        downloadAndInstall: async () => setUpdating(true),
      }
    : null;

  const field = "rounded-md border border-app-border bg-app-tertiary px-2 py-1 text-xs text-app-text";

  return (
    <>
      <div className="fixed left-1/2 top-3 z-200 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-app-border bg-app-dropdown px-3 py-2 shadow-lg">
        <select className={field} value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme">
          {THEMES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button className={field} onClick={() => setDark(!dark)}>
          {dark ? "Dark" : "Light"}
        </button>
        <select
          className={field}
          value={notesCase}
          onChange={(e) => setNotesCase(e.target.value as keyof typeof CASES)}
          aria-label="Release notes"
        >
          {Object.keys(CASES).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className={field} onClick={() => setUpdating(!updating)}>
          {updating ? "Updating…" : "Ready"}
        </button>
        <button className={field} onClick={() => setOpen(true)} disabled={open}>
          Show again
        </button>
      </div>

      <UpdateModal
        updateAvailable={update}
        setUpdateAvailable={() => setOpen(false)}
        isUpdating={updating}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Preview />
  </React.StrictMode>,
);
