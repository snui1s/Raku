import Database from "@tauri-apps/plugin-sql";
import { runGarbageCollection } from "../utils/imageUtils";
import { Note } from "../hooks/useNotes";

const STORAGE_KEY = "raku-notes"; // Legacy storage key
const ACTIVE_NOTE_KEY = "raku-active-note";

const generateId = () =>
  `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const initDatabase = async (): Promise<{
  db: Database;
  notes: Note[];
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

    // Schema Migration: Add is_manual_title if missing
    try {
      await dbInstance.execute(
        "ALTER TABLE notes ADD COLUMN is_manual_title INTEGER DEFAULT 0"
      );
    } catch (e) {
      const msg = String(e);
      if (!msg.includes("duplicate column")) {
        console.log("Schema migration note: ", msg);
      }
    }

    // Schema Migration: Add font_family if missing
    try {
      await dbInstance.execute(
        "ALTER TABLE notes ADD COLUMN font_family TEXT DEFAULT 'LineSeed'"
      );
    } catch (e) {
      const msg = String(e);
      if (!msg.includes("duplicate column")) {
        console.log("Schema migration note: ", msg);
      }
    }

    // Schema Migration: Add font_size if missing
    try {
      await dbInstance.execute(
        "ALTER TABLE notes ADD COLUMN font_size INTEGER DEFAULT 16"
      );
    } catch (e) {
      const msg = String(e);
      if (!msg.includes("duplicate column")) {
        console.log("Schema migration note: ", msg);
      }
    }

    // Migration: Check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Note[];
        if (parsed.length > 0) {
          console.log(
            "Migrating notes from localStorage to SQLite...",
            parsed.length
          );
          for (const note of parsed) {
            await dbInstance.execute(
              "INSERT OR REPLACE INTO notes (id, title, content, created_at, updated_at, is_manual_title) VALUES ($1, $2, $3, $4, $5, 0)",
              [
                note.id,
                note.title,
                note.content,
                note.createdAt,
                note.updatedAt,
              ]
            );
          }
        }
      } catch (e) {
        console.error("Migration failed:", e);
      }
      localStorage.removeItem(STORAGE_KEY);
    }

    // Load Notes from DB
    const result = await dbInstance.select<any[]>(
      "SELECT * FROM notes ORDER BY updated_at DESC"
    );
    const loadedNotes: Note[] = result.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isManualTitle: !!row.is_manual_title,
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

    return { db: dbInstance, notes: loadedNotes, activeNoteId: activeId };

  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};
