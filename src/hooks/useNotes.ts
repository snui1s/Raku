import { useState, useEffect, useCallback } from "react";

export interface Note {
  id: string;
  title: string;
  content: string; // JSON string from Tiptap
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "raku-notes";
const ACTIVE_NOTE_KEY = "raku-active-note";

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

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Note[];
        setNotes(parsed);

        // Restore active note
        const activeId = localStorage.getItem(ACTIVE_NOTE_KEY);
        if (activeId && parsed.find((n) => n.id === activeId)) {
          setActiveNoteId(activeId);
        } else if (parsed.length > 0) {
          setActiveNoteId(parsed[0].id);
        }
      } catch {
        // Invalid data, start fresh
        setNotes([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save notes to localStorage when changed
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  // Save active note ID
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem(ACTIVE_NOTE_KEY, activeNoteId);
    }
  }, [activeNoteId]);

  // Get active note
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Create new note
  const createNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(),
      title: "Untitled",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  }, []);

  // Update note content
  const updateNote = useCallback((id: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              content,
              title: extractTitle(content),
              updatedAt: Date.now(),
            }
          : note
      )
    );
  }, []);

  // Delete note
  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        // If deleting active note, switch to first available
        if (activeNoteId === id && filtered.length > 0) {
          setActiveNoteId(filtered[0].id);
        } else if (filtered.length === 0) {
          setActiveNoteId(null);
        }
        return filtered;
      });
    },
    [activeNoteId]
  );

  // Select note
  const selectNote = useCallback((id: string) => {
    setActiveNoteId(id);
  }, []);

  return {
    notes,
    activeNote,
    activeNoteId,
    isLoaded,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
  };
}
