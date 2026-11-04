// Search over note titles and note text for the command palette. Pure, no Tauri imports,
// so it can be unit tested.
import type { Note } from "../hooks/useNotes";

export interface IndexedNote {
  note: Note;
  title: string;
  titleLower: string;
  text: string;
  textLower: string;
}

export interface NoteHit {
  note: Note;
  // text around the match, null when the title matched
  snippet: string | null;
}

// Plain text of a Tiptap JSON string: the text nodes in document order, one space between them
export const noteText = (content: string): string => {
  const parts: string[] = [];
  const walk = (node: any) => {
    if (typeof node?.text === "string") parts.push(node.text);
    if (Array.isArray(node?.content)) node.content.forEach(walk);
  };
  try {
    walk(JSON.parse(content));
  } catch {
    return "";
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
};

// Parse every note once, so a keystroke in the palette only runs string searches
export const indexNotes = (notes: Note[]): IndexedNote[] =>
  notes.map((note) => {
    const title = note.title || "Untitled";
    const text = noteText(note.content);
    return { note, title, titleLower: title.toLowerCase(), text, textLower: text.toLowerCase() };
  });

const SNIPPET_BEFORE = 24;
const SNIPPET_AFTER = 56;

const snippetAround = (text: string, at: number, length: number): string => {
  const start = Math.max(0, at - SNIPPET_BEFORE);
  const end = Math.min(text.length, at + length + SNIPPET_AFTER);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
};

const newestFirst = (a: IndexedNote, b: IndexedNote) => b.note.updatedAt - a.note.updatedAt;

// Notes whose title matches come first, then notes whose text matches, each group newest first.
// An empty query lists the newest notes.
export const searchNotes = (index: IndexedNote[], query: string, limit: number): NoteHit[] => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...index]
      .sort(newestFirst)
      .slice(0, limit)
      .map((n) => ({ note: n.note, snippet: null }));
  }

  const byTitle = index.filter((n) => n.titleLower.includes(q)).sort(newestFirst);
  const byText = index
    .filter((n) => !n.titleLower.includes(q) && n.textLower.includes(q))
    .sort(newestFirst);

  return [
    ...byTitle.map((n) => ({ note: n.note, snippet: null })),
    ...byText.map((n) => ({ note: n.note, snippet: snippetAround(n.text, n.textLower.indexOf(q), q.length) })),
  ].slice(0, limit);
};
