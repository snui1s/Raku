// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const check = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/plugin-updater", () => ({ check }));

import { useAppUpdate } from "./useAppUpdate";

beforeEach(() => {
  check.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useAppUpdate", () => {
  it("has no update when the app is up to date", async () => {
    check.mockResolvedValue(null);
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    expect(result.current.updateAvailable).toBeNull();
  });

  it("has no update when the check says none is available", async () => {
    check.mockResolvedValue({ available: false, version: "9.9.9" });
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(check).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBeNull();
  });

  it("offers the new version with its notes", async () => {
    check.mockResolvedValue({ available: true, version: "1.2.0", body: "notes here", downloadAndInstall: vi.fn() });
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(result.current.updateAvailable).not.toBeNull());
    expect(result.current.updateAvailable).toMatchObject({ version: "1.2.0", notes: "notes here" });
  });

  it("uses empty notes when the release has none", async () => {
    check.mockResolvedValue({ available: true, version: "1.2.0", downloadAndInstall: vi.fn() });
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(result.current.updateAvailable).not.toBeNull());
    expect(result.current.updateAvailable!.notes).toBe("");
  });

  it("stays quiet when the check fails, for example with no network", async () => {
    check.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(check).toHaveBeenCalled());
    await act(async () => {});
    expect(result.current.updateAvailable).toBeNull();
    expect(result.current.isUpdating).toBe(false);
  });

  it("marks the update as running while it installs", async () => {
    let finish: () => void = () => {};
    const downloadAndInstall = vi.fn(() => new Promise<void>((r) => (finish = r)));
    check.mockResolvedValue({ available: true, version: "1.2.0", body: "", downloadAndInstall });
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(result.current.updateAvailable).not.toBeNull());

    expect(result.current.isUpdating).toBe(false);
    let done: Promise<void>;
    act(() => {
      done = result.current.updateAvailable!.downloadAndInstall();
    });
    expect(result.current.isUpdating).toBe(true);
    expect(downloadAndInstall).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await done;
    });
  });

  it("can dismiss the offer", async () => {
    check.mockResolvedValue({ available: true, version: "1.2.0", body: "", downloadAndInstall: vi.fn() });
    const { result } = renderHook(() => useAppUpdate());
    await waitFor(() => expect(result.current.updateAvailable).not.toBeNull());
    act(() => result.current.setUpdateAvailable(null));
    expect(result.current.updateAvailable).toBeNull();
  });
});
