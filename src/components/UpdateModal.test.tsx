// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { UpdateModal } from "./UpdateModal";

afterEach(cleanup);

const setup = (over: { notes?: string; isUpdating?: boolean; none?: boolean } = {}) => {
  const downloadAndInstall = vi.fn();
  const setUpdateAvailable = vi.fn();
  render(
    <UpdateModal
      updateAvailable={over.none ? null : { version: "1.2.0", notes: over.notes ?? "", downloadAndInstall }}
      setUpdateAvailable={setUpdateAvailable}
      isUpdating={over.isUpdating ?? false}
    />
  );
  return { downloadAndInstall, setUpdateAvailable };
};

describe("UpdateModal", () => {
  it("shows nothing when there is no update", () => {
    setup({ none: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("names the new version", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Update available" })).toBeTruthy();
    expect(screen.getByText("Raku 1.2.0 is ready to install.")).toBeTruthy();
  });

  it("shows the release notes", () => {
    setup({ notes: "* fix: something\n* feat: other" });
    expect(screen.getByText(/fix: something/)).toBeTruthy();
  });

  it.each(["Release v1.2.0", "release 1.2", "  Release v10.20.30  ", ""])(
    "leaves out the notes %j, which only repeat the version",
    (notes) => {
      setup({ notes });
      expect(screen.queryByText(/release/i)).toBeNull();
    }
  );

  it("keeps notes that only start like the default one", () => {
    setup({ notes: "Release v1.2.0 fixes saving" });
    expect(screen.getByText("Release v1.2.0 fixes saving")).toBeTruthy();
  });

  it("installs the update when asked", () => {
    const { downloadAndInstall } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(downloadAndInstall).toHaveBeenCalledTimes(1);
  });

  it("closes on Later", () => {
    const { setUpdateAvailable } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(setUpdateAvailable).toHaveBeenCalledWith(null);
  });

  it("locks both buttons while it updates", () => {
    setup({ isUpdating: true });
    expect((screen.getByRole("button", { name: "Updating…" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Later" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
