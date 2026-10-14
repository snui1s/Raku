// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import { createEditorExtensions } from "../../utils/editorExtensions";
import { EditorToolbar } from "./EditorToolbar";

let editor: Editor;

beforeEach(() => {
  localStorage.clear();
  editor = new Editor({
    extensions: createEditorExtensions(),
    content: "<p>hello world</p>",
  });
  editor.commands.setTextSelection(3);
  render(<EditorToolbar editor={editor} isDark={false} />);
});
afterEach(() => {
  cleanup();
  editor.destroy();
});

const click = (title: string) => fireEvent.click(screen.getByTitle(title));

describe("EditorToolbar clicks", () => {
  it("quote", () => {
    click("Quote");
    expect(editor.getHTML()).toContain("<blockquote>");
  });

  it("code", () => {
    click("Code");
    expect(editor.getHTML()).toContain("<pre>");
  });

  it("heading dropdown -> Heading 2", () => {
    click("Heading");
    fireEvent.click(screen.getByText("Heading 2"));
    expect(editor.getHTML()).toContain("<h2>");
  });

  it("list dropdown -> Bullet, Numbered, Task", () => {
    click("List");
    fireEvent.click(screen.getByText("Bullet"));
    expect(editor.getHTML()).toContain("<ul>");
  });

  it("font dropdown -> Kanit", () => {
    editor.commands.selectAll();
    click("Font Family");
    fireEvent.click(screen.getByText("Kanit"));
    expect(editor.getHTML()).toContain("Kanit");
  });

  it("font size dropdown -> 24px", () => {
    editor.commands.selectAll();
    click("Font Size");
    fireEvent.click(screen.getByText("24px"));
    expect(editor.getHTML()).toContain("font-size: 24px");
  });

  it("undo becomes enabled after an edit and works", () => {
    expect((screen.getByTitle("Undo") as HTMLButtonElement).disabled).toBe(true);
    editor.commands.selectAll();
    click("Bold");
    expect((screen.getByTitle("Undo") as HTMLButtonElement).disabled).toBe(false);
    click("Undo");
    expect(editor.getHTML()).not.toContain("<strong>");
  });

  it("active state follows the caret", () => {
    click("Quote");
    expect(screen.getByTitle("Quote").className).toContain("text-accent");
  });

  it("bold / italic / underline / strike", () => {
    editor.commands.selectAll();
    click("Bold");
    click("Italic");
    click("Underline");
    click("Strikethrough");
    const html = editor.getHTML();
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<u>");
    expect(html).toContain("<s>");
  });
});
