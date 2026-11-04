// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const execute = vi.fn();
const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const original = doc("hello");

vi.mock("@tauri-apps/plugin-sql", () => ({ default: class {} }));
vi.mock("../services/db", () => ({
  initDatabase: async () => ({
    db: { execute: (...args: unknown[]) => execute(...args) },
    notes: [{ id: "n1", title: "hello", content: original, createdAt: 0, updatedAt: 1 }],
    folders: [],
    activeNoteId: "n1",
  }),
}));

import { useNotes } from "./useNotes";

const setup = async () => {
  const hook = renderHook(() => useNotes());
  await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
  // the note list reaches notesRef through an effect after the load
  await waitFor(() => expect(hook.result.current.notes).toHaveLength(1));
  return hook;
};

beforeEach(() => {
  execute.mockReset();
  execute.mockResolvedValue(undefined);
});

describe("updateNote result", () => {
  it("returns true and writes when the content changed", async () => {
    const { result } = await setup();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.updateNote("n1", doc("changed"));
    });
    expect(ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0]).toContain("UPDATE notes");
    expect(result.current.saveError).toBeNull();
  });

  it("returns true without writing when nothing changed", async () => {
    const { result } = await setup();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.updateNote("n1", original);
    });
    expect(ok).toBe(true);
    expect(execute).not.toHaveBeenCalled();
  });

  it("returns false and reports the error when the write fails", async () => {
    execute.mockRejectedValue(new Error("disk full"));
    const { result } = await setup();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.updateNote("n1", doc("changed"));
    });
    expect(ok).toBe(false);
    expect(result.current.saveError).toContain("Could not save note");
  });

  it("returns false for a note that does not exist", async () => {
    const { result } = await setup();
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.updateNote("missing", doc("x"));
    });
    expect(ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });
});
