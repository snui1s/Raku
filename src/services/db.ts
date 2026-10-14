import Database from "@tauri-apps/plugin-sql";
import { runGarbageCollection } from "../utils/imageUtils";
import { Note, Folder } from "../hooks/useNotes";

const STORAGE_KEY = "raku-notes"; // Legacy storage key
const ACTIVE_NOTE_KEY = "raku-active-note";

const generateId = () =>
  `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Versioned schema migrations, tracked with SQLite's PRAGMA user_version.
// Append new entries; never edit or reorder existing ones.
type Migration = { version: number; up: (db: Database) => Promise<void> };

const addMissingColumns = async (db: Database, columns: [string, string][]) => {
  const existing = await db.select<{ name: string }[]>(
    "PRAGMA table_info(notes)"
  );
  const have = new Set(existing.map((c) => c.name));
  for (const [name, def] of columns) {
    if (!have.has(name)) {
      await db.execute(`ALTER TABLE notes ADD COLUMN ${name} ${def}`);
    }
  }
};

const MIGRATIONS: Migration[] = [
  {
    // Columns added over v1.0.x. Older installs may already have some of them,
    // so each is only added when missing.
    version: 1,
    up: (db) =>
      addMissingColumns(db, [
        ["is_manual_title", "INTEGER DEFAULT 0"],
        ["font_family", "TEXT DEFAULT 'LineSeed'"],
        ["font_size", "INTEGER DEFAULT 16"],
        ["is_pinned", "INTEGER DEFAULT 0"],
      ]),
  },
  {
    // Folders: notes may belong to one folder (NULL = Inbox)
    version: 2,
    up: async (db) => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER
        )
      `);
      await addMissingColumns(db, [["folder_id", "TEXT"]]);
    },
  },
];

const migrateSchema = async (db: Database) => {
  const [{ user_version: current = 0 } = {}] = await db.select<
    { user_version: number }[]
  >("PRAGMA user_version");

  for (const m of MIGRATIONS.filter((m) => m.version > current)) {
    await m.up(db);
    await db.execute(`PRAGMA user_version = ${m.version}`);
  }
};

export const initDatabase = async (): Promise<{
  db: Database;
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
}> => {
  try {
    const dbInstance = await Database.load("sqlite:raku.db");

    // Create Table
    await dbInstance.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        is_manual_title INTEGER DEFAULT 0,
        font_family TEXT DEFAULT 'LineSeed',
        font_size INTEGER DEFAULT 16
      )
    `);

    await migrateSchema(dbInstance);

    // Migration: Check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let migrated = false;
      try {
        const parsed = JSON.parse(stored) as Note[];
        if (parsed.length > 0) {
          for (const note of parsed) {
            await dbInstance.execute(
              "INSERT OR REPLACE INTO notes (id, title, content, created_at, updated_at, is_manual_title, is_pinned) VALUES ($1, $2, $3, $4, $5, 0, $6)",
              [
                note.id,
                note.title,
                note.content,
                note.createdAt,
                note.updatedAt,
                note.isPinned ? 1 : 0,
              ]
            );
          }
        }
        migrated = true;
      } catch (e) {
        console.error("Migration failed:", e);
      }
      // Keep the legacy data if migration failed so it can be retried next launch
      if (migrated) localStorage.removeItem(STORAGE_KEY);
    }

    // Load Notes from DB
    const result = await dbInstance.select<any[]>(
      "SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC"
    );
    const loadedNotes: Note[] = result.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isManualTitle: !!row.is_manual_title,
      isPinned: !!row.is_pinned,
      folderId: row.folder_id ?? null,
    }));

    const folderRows = await dbInstance.select<any[]>(
      "SELECT * FROM folders ORDER BY sort_order ASC, created_at ASC"
    );
    const loadedFolders: Folder[] = folderRows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
    }));

    let activeId = localStorage.getItem(ACTIVE_NOTE_KEY);

    if (activeId && loadedNotes.find((n) => n.id === activeId)) {
      // activeId is valid
    } else if (loadedNotes.length > 0) {
      activeId = loadedNotes[0].id;
    } else {
      // Create initial note if empty
      const initialNote: Note = {
        id: generateId(),
        title: "Untitled",
        content: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isManualTitle: false,
      };
      await dbInstance.execute(
        "INSERT INTO notes (id, title, content, created_at, updated_at, is_manual_title) VALUES ($1, $2, $3, $4, $5, 0)",
        [
          initialNote.id,
          initialNote.title,
          initialNote.content,
          initialNote.createdAt,
          initialNote.updatedAt,
        ]
      );
      loadedNotes.push(initialNote);
      activeId = initialNote.id;
    }

    // Run Garbage Collection in background
    runGarbageCollection(dbInstance);

    return {
      db: dbInstance,
      notes: loadedNotes,
      folders: loadedFolders,
      activeNoteId: activeId,
    };

  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};
