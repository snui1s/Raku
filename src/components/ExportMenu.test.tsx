// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExportMenu } from "./ExportMenu";

vi.mock("../services/backup", () => ({
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
}));

afterEach(cleanup);

describe("ExportMenu", () => {
  it("opens from the trigger button", () => {
    const setOpen = vi.fn();
    render(<ExportMenu open={false} setOpen={setOpen} activeNote={null} editor={null} />);
    fireEvent.click(screen.getByTitle("Export & Backup"));
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("shows export and backup actions when open", () => {
    render(<ExportMenu open setOpen={() => {}} activeNote={null} editor={null} />);
    for (const name of ["Markdown", "PDF", "Backup", "Restore"]) {
      expect(screen.getByRole("menuitem", { name: new RegExp(name) })).toBeTruthy();
    }
  });

  it("disables note exports without an active note but keeps backup usable", () => {
    render(<ExportMenu open setOpen={() => {}} activeNote={null} editor={null} />);
    expect((screen.getByRole("menuitem", { name: /Markdown/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("menuitem", { name: /PDF/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("menuitem", { name: /Backup/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("closes on Escape", () => {
    const setOpen = vi.fn();
    render(<ExportMenu open setOpen={setOpen} activeNote={null} editor={null} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
