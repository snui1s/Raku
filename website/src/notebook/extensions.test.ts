import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import { notebookExtensions } from "./extensions";
import { SAMPLE_HTML } from "./sample";

describe("notebookExtensions", () => {
  const schema = getSchema(notebookExtensions());

  it("can write what the app can: headings, lists, checklists, quotes", () => {
    for (const n of ["heading", "paragraph", "bulletList", "orderedList", "taskList", "taskItem", "blockquote"]) {
      expect(schema.nodes[n], n).toBeTruthy();
    }
  });

  it("has the formatting the toolbar offers: bold, italic, underline, highlight, color", () => {
    for (const m of ["bold", "italic", "underline", "highlight", "textStyle"]) expect(schema.marks[m], m).toBeTruthy();
  });

  it("does not turn pasted text into links that navigate away from the page", () => {
    expect(schema.marks.link).toBeUndefined();
  });
});

describe("SAMPLE_HTML", () => {
  it("is a small note with a title, a paragraph and a checklist, and nothing executable", () => {
    expect(SAMPLE_HTML).toMatch(/<h1>/);
    expect(SAMPLE_HTML).toMatch(/<p>/);
    expect(SAMPLE_HTML).toMatch(/data-type="taskList"/);
    expect(SAMPLE_HTML).not.toMatch(/<script|onerror|onclick|javascript:/i);
    expect(SAMPLE_HTML.length).toBeLessThan(2000);
  });

  it("says that nothing leaves the page", () => {
    expect(SAMPLE_HTML).toMatch(/nothing you (write|type)/i);
  });
});
