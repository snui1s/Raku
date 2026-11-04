// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Header } from "./Header";

afterEach(cleanup);

const setup = (over: { canSave?: boolean; justSaved?: boolean; sidebarOpen?: boolean } = {}) => {
  const onSave = vi.fn();
  render(
    <Header
      isDark={false}
      setIsDark={vi.fn()}
      sidebarOpen={over.sidebarOpen ?? true}
      setSidebarOpen={vi.fn()}
      currentTheme="classic"
      setCurrentTheme={vi.fn()}
      zenMode={false}
      setZenMode={vi.fn()}
      exportMenu={null}
      settingsMenu={null}
      crumbs={["Inbox", "My note"]}
      onSave={onSave}
      canSave={over.canSave ?? true}
      justSaved={over.justSaved ?? false}
    />
  );
  return { onSave };
};

describe("Header save button", () => {
  it("saves when clicked", () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("names the shortcut in its tooltip", () => {
    setup();
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("title")).toBe("Save (Ctrl+S)");
  });

  it("is disabled when no note is open", () => {
    const { onSave } = setup({ canSave: false });
    const button = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the saved state after a save", () => {
    setup({ justSaved: true });
    expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("sits on the left, before the location of the note", () => {
    setup();
    const save = screen.getByRole("button", { name: "Save" });
    const location = screen.getByRole("navigation", { name: "Location" });
    expect(save.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("comes after the sidebar button when the sidebar is closed", () => {
    setup({ sidebarOpen: false });
    const show = screen.getByTitle("Show Sidebar");
    const save = screen.getByRole("button", { name: "Save" });
    expect(show.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
