import { useState, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";

export interface Note {
  id: string;
  title: string;
  content: string; // JSON string from Tiptap
  createdAt: number;
  updatedAt: number;
  isManualTitle?: boolean;
}

const STORAGE_KEY = "raku-notes"; // Legacy storage key
const ACTIVE_NOTE_KEY = "raku-active-note"; // Keeping active note ID in localStorage for speed

// Generate unique ID
const generateId = () =>
  `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Get title from content (first line or "Untitled")
const extractTitle = (content: string): string => {
  try {
    const json = JSON.parse(content);
    const firstNode = json?.content?.[0];
    if (firstNode?.content?.[0]?.text) {
      const text = firstNode.content[0].text.trim();
      return text.slice(0, 50) || "Untitled";
    }
  } catch {
    // ignore
  }
  return "Untitled";
};

import { runGarbageCollection } from "../utils/imageUtils";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [db, setDb] = useState<Database | null>(null);

  // Ref to access latest notes in callbacks without dependency
  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Initialize Database & Migrate Data
  useEffect(() => {
    const initDb = async () => {
      try {
        const dbInstance = await Database.load("sqlite:raku.db");
        setDb(dbInstance);

        // Create Table
        await dbInstance.execute(`
          CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            is_manual_title INTEGER DEFAULT 0
          )
        `);

        // Schema Migration: Add is_manual_title if missing
        try {
          await dbInstance.execute(
            "ALTER TABLE notes ADD COLUMN is_manual_title INTEGER DEFAULT 0"
          );
        } catch (e) {
          // Check if error is because column already exists
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

        setNotes(loadedNotes);

        // Restore active note
        const activeId = localStorage.getItem(ACTIVE_NOTE_KEY);
        if (activeId && loadedNotes.find((n) => n.id === activeId)) {
          setActiveNoteId(activeId);
        } else if (loadedNotes.length > 0) {
          setActiveNoteId(loadedNotes[0].id);
        } else {
          // Create initial note if empty
          if (loadedNotes.length === 0) {
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
            setNotes([initialNote]);
            setActiveNoteId(initialNote.id);
          }
        }

        // Initialize success
        setIsLoaded(true);

        // Run Garbage Collection in background
        runGarbageCollection(dbInstance);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        alert(
          `Database Error Details: ${JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          )} \n\nCheck console for more info.`
        );
      }
    };

    initDb();
  }, []);

  // Save active note ID to localStorage (fast access)
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem(ACTIVE_NOTE_KEY, activeNoteId);
    }
  }, [activeNoteId]);

  // Create new note
  const createNote = useCallback(async () => {
    if (!db) return;
    const newNote: Note = {
      id: generateId(),
      title: "Untitled",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isManualTitle: false,
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);

    try {
      await db.execute(
        "INSERT INTO notes (id, title, content, created_at, updated_at, is_manual_title) VALUES ($1, $2, $3, $4, $5, 0)",
        [
          newNote.id,
          newNote.title,
          newNote.content,
          newNote.createdAt,
          newNote.updatedAt,
        ]
      );
    } catch (e) {
      console.error("Failed to create note:", e);
    }
    return newNote;
  }, [db]);

  // Update note content
  const updateNote = useCallback(
    async (id: string, content: string) => {
      if (!db) return;

      let title = extractTitle(content);
      const currentNote = notesRef.current.find((n) => n.id === id);

      // Respect manual title
      if (currentNote?.isManualTitle) {
        title = currentNote.title;
      }

      const updatedAt = Date.now();

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, content, title, updatedAt } : note
        )
      );

      try {
        await db.execute(
          "UPDATE notes SET content = $1, title = $2, updated_at = $3 WHERE id = $4",
          [content, title, updatedAt, id]
        );
      } catch (e) {
        console.error("Failed to update note:", e);
      }
    },
    [db] // No 'notes' dependency
  );

  // Delete note
  const deleteNote = useCallback(
    async (id: string) => {
      if (!db) return;

      setNotes((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        if (activeNoteId === id && filtered.length > 0) {
          setActiveNoteId(filtered[0].id);
        } else if (filtered.length === 0) {
          setActiveNoteId(null);
        }
        return filtered;
      });

      try {
        await db.execute("DELETE FROM notes WHERE id = $1", [id]);
      } catch (e) {
        console.error("Failed to delete note:", e);
      }
    },
    [db, activeNoteId]
  );

  // Select note
  const selectNote = useCallback((id: string) => {
    setActiveNoteId(id);
  }, []);

  // Rename note
  const renameNote = useCallback(
    async (id: string, newTitle: string) => {
      if (!db) return;
      const updatedAt = Date.now();

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, title: newTitle, updatedAt, isManualTitle: true }
            : note
        )
      );

      try {
        await db.execute(
          "UPDATE notes SET title = $1, updated_at = $2, is_manual_title = 1 WHERE id = $3",
          [newTitle, updatedAt, id]
        );
      } catch (e) {
        console.error("Failed to rename note:", e);
      }
    },
    [db]
  );

  return {
    notes,
    activeNote: notes.find((n) => n.id === activeNoteId) || null,
    activeNoteId,
    isLoaded,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    renameNote,
  };
}
