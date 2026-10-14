// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import type { Note, Folder } from "../hooks/useNotes";

vi.mock("../assets/logo.svg", () => ({ default: "logo.svg" }));

const folders: Folder[] = [{ id: "f1", name: "Work", color: "#F25C54" }];
const notes: Note[] = [
  { id: "n1", title: "Loose note", content: "", createdAt: 1, updatedAt: 3, folderId: null },
  { id: "n2", title: "Filed note", content: "", createdAt: 1, updatedAt: 2, folderId: "f1" },
];

const setup = () => {
  const moveNote = vi.fn();
  const handleSelectNote = vi.fn();
  render(
    <Sidebar
      notes={notes}
      folders={folders}
      activeNoteId="n1"
      renamingNoteId={null}
      renameValue=""
      setSidebarOpen={() => {}}
      createNote={() => {}}
      handleSelectNote={handleSelectNote}
      setRenameValue={() => {}}
      setRenamingNoteId={() => {}}
      renameNote={() => {}}
      deleteNote={() => {}}
      togglePinNote={() => {}}
      moveNote={moveNote}
      createFolder={() => {}}
      renameFolder={() => {}}
      deleteFolder={() => {}}
      onOpenPalette={() => {}}
    />
  );
  return { moveNote, handleSelectNote };
};

// jsdom has no layout, so point elementFromPoint at the element we "drop" on
const dropOn = (el: Element | null) => {
  document.elementFromPoint = () => el as Element;
};

afterEach(() => {
  cleanup();
  document.body.classList.remove("raku-dragging");
});

describe("Sidebar drag and drop", () => {
  it("dragging a note onto a folder moves it", () => {
    const { moveNote, handleSelectNote } = setup();
    const note = screen.getByText("Loose note").closest("button")!;
    const folder = document.querySelector('[data-drop="f1"]')!;

    fireEvent.pointerDown(note, { button: 0, clientX: 10, clientY: 10 });
    dropOn(folder);
    fireEvent.pointerMove(window, { clientX: 60, clientY: 60 });
    fireEvent.pointerUp(window, { clientX: 60, clientY: 60 });
    fireEvent.click(note); // the click that follows a drag must not select the note

    expect(moveNote).toHaveBeenCalledWith("n1", "f1");
    expect(handleSelectNote).not.toHaveBeenCalled();
  });

  it("dragging a filed note onto the Inbox clears its folder", () => {
    const { moveNote } = setup();
    const note = screen.getByText("Filed note").closest("button")!;

    fireEvent.pointerDown(note, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 40, clientY: 40 });
    dropOn(document.querySelector('[data-drop="inbox"]'));
    fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 50, clientY: 50 });

    expect(moveNote).toHaveBeenCalledWith("n2", null);
  });

  it("a plain click still selects the note and does not move it", () => {
    const { moveNote, handleSelectNote } = setup();
    const note = screen.getByText("Loose note").closest("button")!;
    fireEvent.pointerDown(note, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(window, { clientX: 11, clientY: 11 });
    fireEvent.click(note);
    expect(handleSelectNote).toHaveBeenCalledWith("n1");
    expect(moveNote).not.toHaveBeenCalled();
  });

  it("dropping outside any target, or on the same folder, does nothing", () => {
    const { moveNote } = setup();
    const note = screen.getByText("Filed note").closest("button")!;
    fireEvent.pointerDown(note, { button: 0, clientX: 10, clientY: 10 });
    dropOn(document.querySelector('[data-drop="f1"]'));
    fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
    fireEvent.pointerUp(window, { clientX: 50, clientY: 50 });
    expect(moveNote).not.toHaveBeenCalled();
  });

  it("Escape cancels a drag", () => {
    const { moveNote } = setup();
    const note = screen.getByText("Loose note").closest("button")!;
    fireEvent.pointerDown(note, { button: 0, clientX: 10, clientY: 10 });
    dropOn(document.querySelector('[data-drop="f1"]'));
    fireEvent.pointerMove(window, { clientX: 60, clientY: 60 });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.pointerUp(window, { clientX: 60, clientY: 60 });
    expect(moveNote).not.toHaveBeenCalled();
    expect(document.body.classList.contains("raku-dragging")).toBe(false);
  });
});
