// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// A tiny stand-in for the SQLite database: it keeps user_version and the columns of notes,
// and records every statement, which is all the migrations look at.
const fake = vi.hoisted(() => {
  const state = {
    userVersion: 0,
    columns: [] as string[],
    notes: [] as Record<string, unknown>[],
    folders: [] as Record<string, unknown>[],
    statements: [] as string[],
    failOn: null as string | null,
  };
  const db = {
    execute: async (sql: string, params?: unknown[]) => {
      const s = sql.replace(/\s+/g, " ").trim();
      state.statements.push(s);
      if (state.failOn && s.includes(state.failOn)) throw new Error("boom");
      const version = s.match(/^PRAGMA user_version = (\d+)$/);
      if (version) state.userVersion = Number(version[1]);
      const col = s.match(/^ALTER TABLE notes ADD COLUMN (\w+)/);
      if (col) state.columns.push(col[1]);
      if (s.startsWith("INSERT")) state.notes.push({ __sql: s, __params: params });
    },
    select: async (sql: string) => {
      if (sql === "PRAGMA user_version") return [{ user_version: state.userVersion }];
      if (sql === "PRAGMA table_info(notes)") return state.columns.map((name) => ({ name }));
      if (sql.startsWith("SELECT * FROM notes")) return state.notes.filter((n) => !("__sql" in n));
      if (sql.startsWith("SELECT * FROM folders")) return state.folders;
      return [];
    },
  };
  return { state, db };
});

vi.mock("@tauri-apps/plugin-sql", () => ({ default: { load: async () => fake.db } }));
const gc = vi.hoisted(() => vi.fn());
vi.mock("../utils/imageUtils", () => ({ runGarbageCollection: gc }));

import { initDatabase } from "./db";

const BASE_COLUMNS = ["id", "title", "content", "created_at", "updated_at", "is_manual_title", "font_family", "font_size"];
const ALL_COLUMNS = [...BASE_COLUMNS, "is_pinned", "folder_id"];

beforeEach(() => {
  localStorage.clear();
  gc.mockReset();
  Object.assign(fake.state, {
    userVersion: 0,
    columns: [...BASE_COLUMNS],
    notes: [],
    folders: [],
    statements: [],
    failOn: null,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const alters = () => fake.state.statements.filter((s) => s.startsWith("ALTER TABLE"));
const row = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  title: "T",
  content: "C",
  created_at: 1,
  updated_at: 2,
  is_manual_title: 0,
  is_pinned: 0,
  folder_id: null,
  ...over,
});

describe("schema migrations", () => {
  it("brings a new database to the latest version", async () => {
    await initDatabase();
    expect(fake.state.userVersion).toBe(2);
    expect(fake.state.statements.some((s) => s.startsWith("CREATE TABLE IF NOT EXISTS folders"))).toBe(true);
  });

  it("adds only the columns an older database does not have yet", async () => {
    fake.state.columns = [...BASE_COLUMNS, "is_pinned"];
    await initDatabase();
    expect(alters()).toEqual(["ALTER TABLE notes ADD COLUMN folder_id TEXT"]);
  });

  it("adds every missing column to a very old database", async () => {
    fake.state.columns = ["id", "title", "content", "created_at", "updated_at"];
    await initDatabase();
    expect(alters().map((s) => s.match(/COLUMN (\w+)/)![1])).toEqual([
      "is_manual_title",
      "font_family",
      "font_size",
      "is_pinned",
      "folder_id",
    ]);
  });

  it("runs nothing when the database is already up to date", async () => {
    fake.state.userVersion = 2;
    fake.state.columns = ALL_COLUMNS;
    await initDatabase();
    expect(alters()).toEqual([]);
    expect(fake.state.statements.some((s) => s.startsWith("PRAGMA user_version ="))).toBe(false);
  });

  it("runs only the migrations after the current version", async () => {
    fake.state.userVersion = 1;
    fake.state.columns = [...BASE_COLUMNS, "is_pinned"];
    await initDatabase();
    expect(fake.state.userVersion).toBe(2);
    expect(fake.state.statements.filter((s) => s.startsWith("PRAGMA user_version ="))).toEqual([
      "PRAGMA user_version = 2",
    ]);
  });

  it("does not advance the version past a migration that failed", async () => {
    fake.state.failOn = "CREATE TABLE IF NOT EXISTS folders";
    await expect(initDatabase()).rejects.toThrow("boom");
    expect(fake.state.userVersion).toBe(1);
  });
});

describe("loading notes", () => {
  it("maps rows to notes and folders", async () => {
    fake.state.userVersion = 2;
    fake.state.notes = [row({ is_manual_title: 1, is_pinned: 1, folder_id: "f1" })];
    fake.state.folders = [{ id: "f1", name: "Work", color: "#fff" }];
    const { notes, folders } = await initDatabase();
    expect(notes[0]).toEqual({
      id: "n1",
      title: "T",
      content: "C",
      createdAt: 1,
      updatedAt: 2,
      isManualTitle: true,
      isPinned: true,
      folderId: "f1",
    });
    expect(folders).toEqual([{ id: "f1", name: "Work", color: "#fff" }]);
  });

  it("opens the note that was open last time", async () => {
    fake.state.notes = [row({ id: "a" }), row({ id: "b" })];
    localStorage.setItem("raku-active-note", "b");
    expect((await initDatabase()).activeNoteId).toBe("b");
  });

  it("opens the first note when the remembered one is gone", async () => {
    fake.state.notes = [row({ id: "a" }), row({ id: "b" })];
    localStorage.setItem("raku-active-note", "deleted");
    expect((await initDatabase()).activeNoteId).toBe("a");
  });

  it("creates a first note in an empty database", async () => {
    const { notes, activeNoteId } = await initDatabase();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Untitled");
    expect(activeNoteId).toBe(notes[0].id);
    expect(fake.state.statements.some((s) => s.startsWith("INSERT INTO notes"))).toBe(true);
  });

  it("starts the image cleanup", async () => {
    await initDatabase();
    expect(gc).toHaveBeenCalledWith(fake.db);
  });
});

describe("notes from the old localStorage storage", () => {
  const legacy = [{ id: "old", title: "Old", content: "x", createdAt: 5, updatedAt: 6, isPinned: true }];

  it("moves them into the database and forgets the old copy", async () => {
    localStorage.setItem("raku-notes", JSON.stringify(legacy));
    await initDatabase();
    const insert = fake.state.notes.find((n) => String(n.__sql).startsWith("INSERT OR REPLACE INTO notes"))!;
    expect(insert.__params).toEqual(["old", "Old", "x", 5, 6, 1]);
    expect(localStorage.getItem("raku-notes")).toBeNull();
  });

  it("keeps the old copy when it can not be read, so it can be tried again", async () => {
    localStorage.setItem("raku-notes", "{not json");
    await initDatabase();
    expect(localStorage.getItem("raku-notes")).toBe("{not json");
  });
});
