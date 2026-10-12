import { useState, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";
import { initDatabase } from "../services/db";
import { extractTitle, hasTextContent } from "../utils/noteUtils";

export interface Note {
  id: string;
  title: string;
  content: string; // JSON string from Tiptap
  createdAt: number;
  updatedAt: number;
  isManualTitle?: boolean;
  isPinned?: boolean;
}

const ACTIVE_NOTE_KEY = "raku-active-note";

// Generate unique ID
const generateId = () =>
  `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [db, setDb] = useState<Database | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ref to access latest notes in callbacks without dependency
  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Initialize Database
  useEffect(() => {
    const init = async () => {
        try {
            const { db: dbInstance, notes: loadedNotes, activeNoteId: activeId } = await initDatabase();
            setDb(dbInstance);
            setNotes(loadedNotes);
            setActiveNoteId(activeId);
            setIsLoaded(true);
        } catch (error) {
            console.error("Database init failed:", error);
            setLoadError(error instanceof Error ? error.message : String(error));
        }
    }
    init();
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
        setSaveError("Could not create note. Your latest changes may not be saved.");
    }
    return newNote;
  }, [db]);

  // Update note content
  const updateNote = useCallback(
    async (id: string, content: string) => {
      if (!db) return;

      const currentNote = notesRef.current.find((n) => n.id === id);
      if (!currentNote) return;

      // Skip update if content has not changed
      if (currentNote.content === content) {
        return;
      }

      // If note was empty ("") and new content has no actual text, skip update
      if (currentNote.content === "" && !hasTextContent(content)) {
        return;
      }

      let title = extractTitle(content);

      // Respect manual title
      if (currentNote.isManualTitle) {
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
        setSaveError(null);
      } catch (e) {
        console.error("Failed to update note:", e);
        setSaveError("Could not save note. Your latest changes may not be saved.");
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
        setSaveError("Could not delete note. Your latest changes may not be saved.");
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
        setSaveError("Could not rename note. Your latest changes may not be saved.");
      }
    },
    [db]
  );

  // Toggle pin note
  const togglePinNote = useCallback(
    async (id: string) => {
      if (!db) return;
      const currentNote = notesRef.current.find((n) => n.id === id);
      if (!currentNote) return;

      const newPinned = !currentNote.isPinned;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, isPinned: newPinned } : note
        )
      );

      try {
        await db.execute("UPDATE notes SET is_pinned = $1 WHERE id = $2", [
          newPinned ? 1 : 0,
          id,
        ]);
      } catch (e) {
        console.error("Failed to toggle pin note:", e);
        setSaveError("Could not update pin. Your latest changes may not be saved.");
      }
    },
    [db]
  );

  return {
    notes,
    activeNote: notes.find((n) => n.id === activeNoteId) || null,
    activeNoteId,
    isLoaded,
    loadError,
    saveError,
    clearSaveError: () => setSaveError(null),
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    renameNote,
    togglePinNote,
  };
}
