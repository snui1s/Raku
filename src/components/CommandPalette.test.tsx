// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import type { Note } from "../hooks/useNotes";

afterEach(cleanup);

const content = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

const notes: Note[] = [
  { id: "a", title: "Shopping", content: content("buy milk and eggs"), createdAt: 0, updatedAt: 10 },
  { id: "b", title: "Milk run", content: content("nothing here"), createdAt: 0, updatedAt: 5 },
];

const setup = () => {
  const onSelectNote = vi.fn();
  render(
    <CommandPalette
      open
      onClose={vi.fn()}
      notes={notes}
      folders={[]}
      onSelectNote={onSelectNote}
      onNewNote={vi.fn()}
      onNewFolder={vi.fn()}
      onToggleTheme={vi.fn()}
      onZen={vi.fn()}
      onExport={vi.fn()}
    />
  );
  return { onSelectNote, input: screen.getByLabelText("Search notes or run a command") };
};

describe("CommandPalette note search", () => {
  it("finds a note by a word in its text and shows the text around it", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "eggs" } });
    expect(screen.getByText("Shopping")).toBeTruthy();
    expect(screen.getByText("buy milk and eggs")).toBeTruthy();
    expect(screen.queryByText("Milk run")).toBeNull();
  });

  it("lists the title match before the text match", () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: "milk" } });
    const names = screen.getAllByRole("button").map((b) => b.textContent ?? "");
    expect(names[0]).toContain("Milk run");
    expect(names[1]).toContain("Shopping");
  });

  it("opens the note that Enter is on", () => {
    const { input, onSelectNote } = setup();
    fireEvent.change(input, { target: { value: "milk" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelectNote).toHaveBeenCalledWith("b");
  });
});
