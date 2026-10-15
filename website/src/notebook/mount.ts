import { Editor, type ChainedCommands } from "@tiptap/core";
import { notebookExtensions } from "./extensions";
import { SAMPLE_HTML } from "./sample";

/** What each toolbar button (data-cmd) does, and how to tell it is on. Nothing is stored: the text lives in the editor only. */
const COMMANDS: Record<string, { run: (c: ChainedCommands) => ChainedCommands; active: (e: Editor) => boolean }> = {
  h1: { run: (c) => c.toggleHeading({ level: 1 }), active: (e) => e.isActive("heading", { level: 1 }) },
  h2: { run: (c) => c.toggleHeading({ level: 2 }), active: (e) => e.isActive("heading", { level: 2 }) },
  bold: { run: (c) => c.toggleBold(), active: (e) => e.isActive("bold") },
  italic: { run: (c) => c.toggleItalic(), active: (e) => e.isActive("italic") },
  underline: { run: (c) => c.toggleUnderline(), active: (e) => e.isActive("underline") },
  highlight: { run: (c) => c.toggleHighlight(), active: (e) => e.isActive("highlight") },
  bullet: { run: (c) => c.toggleBulletList(), active: (e) => e.isActive("bulletList") },
  task: { run: (c) => c.toggleTaskList(), active: (e) => e.isActive("taskList") },
  quote: { run: (c) => c.toggleBlockquote(), active: (e) => e.isActive("blockquote") },
};

/** Turns the plain sample note in `el` into a live editor and wires the toolbar buttons (`data-cmd`) in `toolbar`. */
export function mountNotebook(el: HTMLElement, toolbar: HTMLElement): { destroy(): void } {
  const editor = new Editor({
    element: (el.replaceChildren(), el),
    extensions: notebookExtensions(),
    content: SAMPLE_HTML,
    editorProps: { attributes: { "aria-label": "Notebook demo: write anything, nothing is saved", spellcheck: "false" } },
  });

  const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button[data-cmd]")];
  const refresh = () =>
    buttons.forEach((b) => {
      const on = COMMANDS[b.dataset.cmd ?? ""]?.active(editor) ?? false;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  const onClick = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-cmd]");
    const cmd = b && COMMANDS[b.dataset.cmd ?? ""];
    if (cmd) { cmd.run(editor.chain().focus()).run(); refresh(); }
  };
  const keepFocus = (e: Event) => e.preventDefault(); // pressing a button must not take the caret out of the text
  toolbar.addEventListener("click", onClick);
  toolbar.addEventListener("mousedown", keepFocus);
  editor.on("transaction", refresh);
  buttons.forEach((b) => (b.disabled = false));
  refresh();

  return {
    destroy() {
      toolbar.removeEventListener("click", onClick);
      toolbar.removeEventListener("mousedown", keepFocus);
      editor.destroy();
      buttons.forEach((b) => (b.disabled = true));
    },
  };
}
