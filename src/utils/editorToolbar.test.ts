// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import { createEditorExtensions } from "./editorExtensions";

// These run the exact chains used by EditorToolbar against the real extension set.

let editor: Editor;

const make = (html: string) =>
  new Editor({ extensions: createEditorExtensions(), content: html });

beforeEach(() => {
  editor = make("<p>hello world</p>");
  editor.commands.selectAll();
});
afterEach(() => editor.destroy());

describe("inline formatting", () => {
  it.each([
    ["bold", () => editor.chain().focus().toggleBold().run(), "<strong>"],
    ["italic", () => editor.chain().focus().toggleItalic().run(), "<em>"],
    ["strike", () => editor.chain().focus().toggleStrike().run(), "<s>"],
    ["underline", () => editor.chain().focus().toggleUnderline().run(), "<u>"],
  ])("%s toggles on and off", (_name, run, tag) => {
    expect(run()).toBe(true);
    expect(editor.getHTML()).toContain(tag);
    run();
    expect(editor.getHTML()).not.toContain(tag);
  });

  it("reports active state for the toolbar highlight", () => {
    editor.chain().focus().toggleBold().run();
    expect(editor.isActive("bold")).toBe(true);
  });
});

describe("headings and blocks", () => {
  // Block state is read at a caret (as when the user is typing), not a select-all
  beforeEach(() => {
    editor.commands.setTextSelection(3);
  });

  it.each([1, 2, 3, 4] as const)("heading level %i", (level) => {
    editor.chain().focus().toggleHeading({ level }).run();
    expect(editor.getHTML()).toContain(`<h${level}>`);
    expect(editor.isActive("heading", { level })).toBe(true);
    editor.chain().focus().toggleHeading({ level }).run();
    expect(editor.getHTML()).toContain("<p>");
  });

  it("blockquote", () => {
    editor.chain().focus().toggleBlockquote().run();
    expect(editor.getHTML()).toContain("<blockquote>");
    expect(editor.isActive("blockquote")).toBe(true);
  });

  it("code block", () => {
    editor.chain().focus().toggleCodeBlock().run();
    expect(editor.getHTML()).toContain("<pre>");
    expect(editor.isActive("codeBlock")).toBe(true);
  });
});

describe("lists", () => {
  beforeEach(() => {
    editor.commands.setTextSelection(3);
  });

  it("bullet list", () => {
    editor.chain().focus().toggleBulletList().run();
    expect(editor.getHTML()).toContain("<ul>");
    expect(editor.isActive("bulletList")).toBe(true);
  });
  it("ordered list", () => {
    editor.chain().focus().toggleOrderedList().run();
    expect(editor.getHTML()).toContain("<ol>");
  });
  it("task list", () => {
    editor.chain().focus().toggleTaskList().run();
    expect(editor.getHTML()).toContain('data-type="taskList"');
    expect(editor.isActive("taskList")).toBe(true);
  });
  it("switching between list kinds works", () => {
    editor.chain().focus().toggleBulletList().run();
    editor.chain().focus().toggleOrderedList().run();
    expect(editor.getHTML()).toContain("<ol>");
    expect(editor.getHTML()).not.toContain("<ul>");
  });
});

describe("font, size and colour", () => {
  it("font family", () => {
    editor.chain().focus().setFontFamily("'Kanit', sans-serif").run();
    expect(editor.getHTML()).toContain("font-family");
    expect(editor.getAttributes("textStyle").fontFamily).toContain("Kanit");
  });

  it("font size (custom textStyle attribute)", () => {
    editor.chain().focus().setMark("textStyle", { fontSize: "24px" }).run();
    expect(editor.getHTML()).toContain("font-size: 24px");
    expect(editor.getAttributes("textStyle").fontSize).toBe("24px");
  });

  it("text colour set and unset", () => {
    editor.chain().focus().setColor("#FFADAD").run();
    expect(editor.getAttributes("textStyle").color).toBe("#FFADAD");
    editor.chain().focus().unsetColor().run();
    expect(editor.getAttributes("textStyle").color).toBeFalsy();
  });

  it("highlight with colour (also forces black text) and removal", () => {
    editor
      .chain()
      .focus()
      .setHighlight({ color: "#FDFFB6" })
      .setColor("#000000")
      .run();
    expect(editor.getHTML()).toContain("<mark");
    expect(editor.isActive("highlight")).toBe(true);
    editor.chain().focus().unsetHighlight().run();
    expect(editor.getHTML()).not.toContain("<mark");
  });
});

describe("history", () => {
  it("undo and redo", () => {
    editor.chain().focus().toggleBold().run();
    expect(editor.can().undo()).toBe(true);
    editor.chain().focus().undo().run();
    expect(editor.getHTML()).not.toContain("<strong>");
    expect(editor.can().redo()).toBe(true);
    editor.chain().focus().redo().run();
    expect(editor.getHTML()).toContain("<strong>");
  });
});

describe("content round-trip (what gets saved to SQLite)", () => {
  it("formatted content survives JSON save and load", () => {
    editor.chain().focus().toggleBold().setColor("#A0C4FF").run();
    const saved = JSON.stringify(editor.getJSON());
    const loaded = make("");
    loaded.commands.setContent(JSON.parse(saved));
    expect(loaded.getHTML()).toBe(editor.getHTML());
    loaded.destroy();
  });
});
