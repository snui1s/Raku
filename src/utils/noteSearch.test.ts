import { describe, it, expect } from "vitest";
import { noteText, indexNotes, searchNotes } from "./noteSearch";
import type { Note } from "../hooks/useNotes";

const para = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const doc = (...blocks: unknown[]) => JSON.stringify({ type: "doc", content: blocks });

const note = (id: string, title: string, content: string, updatedAt = 1): Note => ({
  id,
  title,
  content,
  createdAt: 0,
  updatedAt,
});

describe("noteText", () => {
  it("joins the blocks with a space", () => {
    expect(noteText(doc(para("first"), para("second")))).toBe("first second");
  });
  it("reads nested text such as list items", () => {
    const list = {
      type: "bulletList",
      content: [{ type: "listItem", content: [para("milk")] }, { type: "listItem", content: [para("eggs")] }],
    };
    expect(noteText(doc(list))).toBe("milk eggs");
  });
  it("keeps Thai text", () => {
    expect(noteText(doc(para("สวัสดีชาวโลก")))).toBe("สวัสดีชาวโลก");
  });
  it("returns an empty string for empty or invalid content", () => {
    expect(noteText("")).toBe("");
    expect(noteText("not json")).toBe("");
    expect(noteText(doc())).toBe("");
  });
});

describe("searchNotes", () => {
  const notes = [
    note("a", "Shopping", doc(para("buy milk and eggs")), 10),
    note("b", "Milk run", doc(para("nothing here")), 5),
    note("c", "Ideas", doc(para("a story about a milkman")), 20),
    note("d", "Other", doc(para("unrelated")), 30),
  ];
  const index = indexNotes(notes);

  it("lists the most recent notes when the query is empty", () => {
    expect(searchNotes(index, "  ", 8).map((h) => h.note.id)).toEqual(["d", "c", "a", "b"]);
  });

  it("puts title matches before content matches", () => {
    expect(searchNotes(index, "milk", 8).map((h) => h.note.id)).toEqual(["b", "c", "a"]);
  });

  it("orders each group by the last edit, newest first", () => {
    const hits = searchNotes(index, "milk", 8);
    expect(hits.slice(1).map((h) => h.note.id)).toEqual(["c", "a"]);
  });

  it("matches without caring about case", () => {
    expect(searchNotes(index, "SHOPPING", 8).map((h) => h.note.id)).toEqual(["a"]);
  });

  it("gives a snippet for content matches only", () => {
    const hits = searchNotes(index, "milk", 8);
    expect(hits[0].snippet).toBeNull();
    expect(hits[1].snippet).toBe("a story about a milkman");
  });

  it("shortens a long text around the match", () => {
    const long = "start " + "word ".repeat(40) + "needle " + "word ".repeat(40);
    const hit = searchNotes(indexNotes([note("x", "Long", doc(para(long)))]), "needle", 8)[0];
    expect(hit.snippet).toContain("needle");
    expect(hit.snippet!.startsWith("…")).toBe(true);
    expect(hit.snippet!.endsWith("…")).toBe(true);
    expect(hit.snippet!.length).toBeLessThan(100);
  });

  it("finds Thai words", () => {
    const th = indexNotes([note("t", "บันทึก", doc(para("วันนี้ไปตลาดซื้อผัก")))]);
    expect(searchNotes(th, "ตลาด", 8)[0].snippet).toBe("วันนี้ไปตลาดซื้อผัก");
  });

  it("finds an untitled note by the word Untitled", () => {
    const u = indexNotes([note("u", "", doc(para("hello")))]);
    expect(searchNotes(u, "untitled", 8).map((h) => h.note.id)).toEqual(["u"]);
  });

  it("respects the limit", () => {
    expect(searchNotes(index, "", 2)).toHaveLength(2);
  });

  it("returns nothing when no note matches", () => {
    expect(searchNotes(index, "zzz", 8)).toEqual([]);
  });
});
