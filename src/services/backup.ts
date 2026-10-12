import JSZip from "jszip";
import Database from "@tauri-apps/plugin-sql";
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  writeFile,
} from "@tauri-apps/plugin-fs";

const IMAGES_DIR = "images";
const BACKUP_VERSION = 1;

interface BackupNote {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  is_manual_title: number;
  is_pinned: number;
  font_family: string | null;
  font_size: number | null;
}

// Safe file name inside the images folder (no path separators)
const isSafeImageName = (name: string) => /^[\w.-]+$/.test(name);

/** Build a .zip containing every note (notes.json) and every image. */
export async function createBackup(): Promise<{ blob: Blob; filename: string }> {
  const db = await Database.load("sqlite:raku.db");
  const notes = await db.select<BackupNote[]>("SELECT * FROM notes");

  const zip = new JSZip();
  zip.file(
    "notes.json",
    JSON.stringify({ version: BACKUP_VERSION, exportedAt: Date.now(), notes })
  );

  if (await exists(IMAGES_DIR, { baseDir: BaseDirectory.AppData })) {
    const folder = zip.folder("images")!;
    const entries = await readDir(IMAGES_DIR, { baseDir: BaseDirectory.AppData });
    for (const entry of entries) {
      if (!entry.isFile || !entry.name) continue;
      const bytes = await readFile(`${IMAGES_DIR}/${entry.name}`, {
        baseDir: BaseDirectory.AppData,
      });
      folder.file(entry.name, bytes);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  return { blob, filename: `raku-backup-${stamp}.zip` };
}

/**
 * Merge a backup into the current database. Notes with the same id are
 * replaced; nothing is ever deleted. Returns the number of notes restored.
 */
export async function restoreBackup(file: File): Promise<number> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const notesFile = zip.file("notes.json");
  if (!notesFile) throw new Error("Not a Raku backup (notes.json missing).");

  const parsed = JSON.parse(await notesFile.async("string"));
  if (!parsed || !Array.isArray(parsed.notes)) {
    throw new Error("Backup file is corrupted.");
  }
  const notes = parsed.notes as BackupNote[];
  for (const n of notes) {
    if (typeof n.id !== "string" || typeof n.content !== "string") {
      throw new Error("Backup file is corrupted.");
    }
  }

  // Images first, so notes never point at files that are missing
  const imageFiles = zip.file(/^images\/[^/]+$/);
  if (imageFiles.length > 0) {
    if (!(await exists(IMAGES_DIR, { baseDir: BaseDirectory.AppData }))) {
      await mkdir(IMAGES_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
    for (const img of imageFiles) {
      const name = img.name.split("/").pop()!;
      if (!isSafeImageName(name)) continue;
      await writeFile(`${IMAGES_DIR}/${name}`, await img.async("uint8array"), {
        baseDir: BaseDirectory.AppData,
      });
    }
  }

  const db = await Database.load("sqlite:raku.db");
  for (const n of notes) {
    await db.execute(
      `INSERT OR REPLACE INTO notes
        (id, title, content, created_at, updated_at, is_manual_title, is_pinned, font_family, font_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        n.id,
        n.title ?? "Untitled",
        n.content,
        n.created_at ?? Date.now(),
        n.updated_at ?? Date.now(),
        n.is_manual_title ?? 0,
        n.is_pinned ?? 0,
        n.font_family ?? "LineSeed",
        n.font_size ?? 16,
      ]
    );
  }
  return notes.length;
}
