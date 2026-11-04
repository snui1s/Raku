// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import { createEditorExtensions } from "../../utils/editorExtensions";
import { EditorToolbar } from "./EditorToolbar";

let editor: Editor;

const setup = (visible: boolean) => {
  localStorage.setItem("raku-toolbar-visible", String(visible));
  return render(<EditorToolbar editor={editor as never} isDark={false} />);
};

beforeEach(() => {
  editor = new Editor({ extensions: createEditorExtensions(), content: "<p>hello</p>" });
});

afterEach(() => {
  cleanup();
  editor.destroy();
  localStorage.clear();
});

describe("EditorToolbar hidden state", () => {
  it("shows a button to bring the toolbar back", () => {
    setup(false);
    expect(screen.getByTitle("Show Toolbar (Ctrl+Shift+T)")).toBeTruthy();
    expect(screen.queryByTitle("Hide Toolbar (Ctrl+Shift+T)")).toBeNull();
  });

  it("keeps the button in the layout instead of floating over the paper", () => {
    const { container } = setup(false);
    expect(container.querySelector(".fixed")).toBeNull();
    expect(container.querySelector(".absolute")).toBeNull();
  });

  it("brings the toolbar back when the button is clicked", () => {
    setup(false);
    fireEvent.click(screen.getByTitle("Show Toolbar (Ctrl+Shift+T)"));
    expect(screen.getByTitle("Hide Toolbar (Ctrl+Shift+T)")).toBeTruthy();
  });

  it("hides the toolbar when the hide button is clicked", () => {
    setup(true);
    fireEvent.click(screen.getByTitle("Hide Toolbar (Ctrl+Shift+T)"));
    expect(screen.getByTitle("Show Toolbar (Ctrl+Shift+T)")).toBeTruthy();
  });
});
