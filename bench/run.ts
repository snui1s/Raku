// Run with: bun run bench
// Measures the work Raku does over *all* notes (loading, titles, search, image cleanup) and indicative
// SQLite timings. Pure logic + SQLite only: it does not include drawing the UI (see bench/startup.ps1).
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import { makeNotes } from "./data.ts";
import { extractTitle, hasTextContent, findOrphanImages } from "../src/utils/noteUtils.ts";

interface Row {
  group: string;
  name: string;
  median: number;
  min: number;
  runs: number;
}
const rows: Row[] = [];

// Run fn repeatedly (at least 5 runs, at most ~1.5 s) and keep median and best time in ms
function measure(group: string, name: string, fn: () => void) {
  for (let i = 0; i < 3; i++) fn(); // warm-up
  const times: number[] = [];
  const start = performance.now();
  while (times.length < 5 || (performance.now() - start < 1500 && times.length < 200)) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  rows.push({
    group,
    name,
    median: times[Math.floor(times.length / 2)],
    min: times[0],
    runs: times.length,
  });
}

function sqliteWith(notes: ReturnType<typeof makeNotes>) {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE notes (
    id TEXT PRIMARY KEY, title TEXT, content TEXT, created_at INTEGER, updated_at INTEGER,
    is_manual_title INTEGER DEFAULT 0, font_family TEXT, font_size INTEGER,
    is_pinned INTEGER DEFAULT 0, folder_id TEXT)`);
  const insert = db.prepare(
    "INSERT INTO notes (id,title,content,created_at,updated_at,is_pinned,folder_id) VALUES (?,?,?,?,?,?,?)"
  );
  db.exec("BEGIN");
  for (const n of notes) {
    insert.run(n.id, n.title, n.content, n.createdAt, n.updatedAt, n.isPinned ? 1 : 0, n.folderId);
  }
  db.exec("COMMIT");
  return db;
}

for (const count of [1000, 10000]) {
  const group = `${count.toLocaleString("en-US")} notes`;
  const notes = makeNotes(count);
  const contents = notes.map((n) => n.content);
  const imageFiles = contents
    .map((c) => c.match(/[0-9a-f-]{36}\.png/)?.[0])
    .filter((x): x is string => !!x)
    .concat(Array.from({ length: 50 }, (_, i) => `orphan-${i}.png`));
  const totalMb = contents.reduce((s, c) => s + c.length, 0) / 1e6;

  measure(group, "parse every note's JSON", () => {
    for (const c of contents) JSON.parse(c);
  });
  measure(group, "extract all titles", () => {
    for (const c of contents) extractTitle(c);
  });
  measure(group, "check which notes have text", () => {
    for (const c of contents) hasTextContent(c);
  });
  measure(group, "search titles", () => {
    notes.filter((n) => n.title.toLowerCase().includes("ipsum"));
  });
  measure(group, "sidebar: sort + group (pinned / inbox / folders)", () => {
    const byRecent = (a: { updatedAt: number }, b: { updatedAt: number }) => b.updatedAt - a.updatedAt;
    notes.filter((n) => n.isPinned).sort(byRecent);
    notes.filter((n) => !n.folderId).sort(byRecent);
    const folders = new Map<string, typeof notes>();
    for (const n of notes) {
      if (!n.folderId) continue;
      const list = folders.get(n.folderId) ?? [];
      list.push(n);
      folders.set(n.folderId, list);
    }
    for (const list of folders.values()) list.sort(byRecent);
  });
  measure(group, "image cleanup scan (find unused images)", () => {
    findOrphanImages(imageFiles, contents);
  });

  const db = sqliteWith(notes);
  measure(group, "SQLite: load all notes (startup query)", () => {
    db.prepare("SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC").all();
  });
  measure(group, "SQLite: save one note (auto-save)", () => {
    db.prepare("UPDATE notes SET content = ?, updated_at = ? WHERE id = ?").run("{}", Date.now(), "note-5");
  });
  measure(group, "SQLite: read all contents", () => {
    db.prepare("SELECT content FROM notes").all();
  });
  db.close();
  rows.push({ group, name: `(data size: ${totalMb.toFixed(1)} MB of note content)`, median: NaN, min: NaN, runs: 0 });
}

const cpu = os.cpus()[0]?.model.trim() ?? "unknown CPU";
console.log(`\nRaku benchmark | ${cpu} (${os.cpus().length} threads) | ${(os.totalmem() / 2 ** 30).toFixed(0)} GB RAM | Node ${process.version}\n`);
for (const group of [...new Set(rows.map((r) => r.group))]) {
  console.log(`### ${group}\n`);
  console.log("| Task | Median | Best |");
  console.log("|---|---:|---:|");
  for (const r of rows.filter((r) => r.group === group)) {
    if (Number.isNaN(r.median)) {
      console.log(`| _${r.name}_ | | |`);
      continue;
    }
    console.log(`| ${r.name} | ${r.median.toFixed(2)} ms | ${r.min.toFixed(2)} ms |`);
  }
  console.log("");
}
