import { describe, it, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";

const m = vi.hoisted(() => ({
  select: vi.fn(),
  execute: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  readDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: { load: async () => ({ select: m.select, execute: m.execute }) },
}));
vi.mock("@tauri-apps/plugin-fs", () => ({
  BaseDirectory: { AppData: 1 },
  exists: m.exists,
  mkdir: m.mkdir,
  readDir: m.readDir,
  readFile: m.readFile,
  writeFile: m.writeFile,
}));

import { createBackup, restoreBackup } from "./backup";

const note = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  title: "Hello",
  content: '{"type":"doc"}',
  created_at: 10,
  updated_at: 20,
  is_manual_title: 0,
  is_pinned: 1,
  font_family: "Kanit",
  font_size: 18,
  folder_id: "f1",
  ...over,
});
const folder = { id: "f1", name: "Work", color: "#fff", sort_order: 2, created_at: 5 };

const zipFile = async (entries: Record<string, string | Uint8Array>) => {
  const zip = new JSZip();
  for (const [name, data] of Object.entries(entries)) zip.file(name, data);
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new File([bytes as BlobPart], "backup.zip");
};
const backupJson = (notes: unknown, folders?: unknown) =>
  JSON.stringify({ version: 2, exportedAt: 1, notes, ...(folders === undefined ? {} : { folders }) });

beforeEach(() => {
  vi.resetAllMocks();
  m.exists.mockResolvedValue(false);
  m.execute.mockResolvedValue(undefined);
  m.writeFile.mockResolvedValue(undefined);
  m.mkdir.mockResolvedValue(undefined);
});

describe("createBackup", () => {
  const load = async (blob: Blob) => JSZip.loadAsync(await blob.arrayBuffer());

  it("puts every note and folder in notes.json", async () => {
    m.select.mockImplementation(async (sql: string) => (sql.includes("notes") ? [note()] : [folder]));
    const { blob } = await createBackup();
    const json = JSON.parse(await (await load(blob)).file("notes.json")!.async("string"));
    expect(json.version).toBe(2);
    expect(json.notes).toEqual([note()]);
    expect(json.folders).toEqual([folder]);
  });

  it("names the file after today's date", async () => {
    m.select.mockResolvedValue([]);
    const { filename } = await createBackup();
    expect(filename).toBe(`raku-backup-${new Date().toISOString().slice(0, 10)}.zip`);
  });

  it("adds the image files and skips folders and unnamed entries", async () => {
    m.select.mockResolvedValue([]);
    m.exists.mockResolvedValue(true);
    m.readDir.mockResolvedValue([
      { name: "a.png", isFile: true },
      { name: "sub", isFile: false },
      { name: "", isFile: true },
    ]);
    m.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const zip = await load((await createBackup()).blob);
    expect(Object.keys(zip.files).filter((n) => !zip.files[n].dir)).toEqual(["notes.json", "images/a.png"]);
    expect(m.readFile).toHaveBeenCalledTimes(1);
    expect(m.readFile.mock.calls[0][0]).toBe("images/a.png");
  });

  it("has no images folder when the app has no images", async () => {
    m.select.mockResolvedValue([]);
    const zip = await load((await createBackup()).blob);
    expect(Object.keys(zip.files)).toEqual(["notes.json"]);
  });
});

describe("restoreBackup", () => {
  it("restores the notes of a backup it made itself", async () => {
    m.select.mockImplementation(async (sql: string) => (sql.includes("notes") ? [note()] : [folder]));
    m.exists.mockResolvedValue(true);
    m.readDir.mockResolvedValue([{ name: "a.png", isFile: true }]);
    m.readFile.mockResolvedValue(new Uint8Array([9, 8, 7]));
    const { blob } = await createBackup();

    vi.clearAllMocks();
    m.exists.mockResolvedValue(true);
    const count = await restoreBackup(new File([await blob.arrayBuffer()], "b.zip"));

    expect(count).toBe(1);
    expect(m.writeFile).toHaveBeenCalledWith("images/a.png", new Uint8Array([9, 8, 7]), { baseDir: 1 });
    const noteCall = m.execute.mock.calls.find((c) => String(c[0]).includes("INTO notes"))!;
    expect(noteCall[1]).toEqual(["n1", "Hello", '{"type":"doc"}', 10, 20, 0, 1, "Kanit", 18, "f1"]);
    const folderCall = m.execute.mock.calls.find((c) => String(c[0]).includes("INTO folders"))!;
    expect(folderCall[1]).toEqual(["f1", "Work", "#fff", 2, 5]);
  });

  it("restores folders before the notes that point at them", async () => {
    await restoreBackup(await zipFile({ "notes.json": backupJson([note()], [folder]) }));
    const order = m.execute.mock.calls.map((c) => (String(c[0]).includes("folders") ? "folder" : "note"));
    expect(order).toEqual(["folder", "note"]);
  });

  it("accepts an old backup without folders", async () => {
    const count = await restoreBackup(await zipFile({ "notes.json": backupJson([note()]) }));
    expect(count).toBe(1);
    expect(m.execute).toHaveBeenCalledTimes(1);
  });

  it("fills in what an old backup does not have", async () => {
    await restoreBackup(await zipFile({ "notes.json": backupJson([{ id: "x", content: "c" }]) }));
    const params = m.execute.mock.calls[0][1];
    expect(params[0]).toBe("x");
    expect(params[1]).toBe("Untitled");
    expect(params.slice(5)).toEqual([0, 0, "LineSeed", 16, null]);
  });

  it("creates the images folder when it does not exist", async () => {
    await restoreBackup(await zipFile({ "notes.json": backupJson([note()]), "images/a.png": "x" }));
    expect(m.mkdir).toHaveBeenCalledWith("images", { baseDir: 1, recursive: true });
  });

  it("rejects a zip that is not a Raku backup", async () => {
    await expect(restoreBackup(await zipFile({ "other.txt": "x" }))).rejects.toThrow("Not a Raku backup");
  });

  it.each([
    ["notes is not a list", JSON.stringify({ notes: "nope" })],
    ["a note has no id", backupJson([{ content: "c" }])],
    ["a note has no content", backupJson([{ id: "a" }])],
  ])("rejects a corrupted backup (%s) before it changes anything", async (_name, json) => {
    const file = await zipFile({ "notes.json": json, "images/a.png": "x" });
    await expect(restoreBackup(file)).rejects.toThrow("corrupted");
    expect(m.writeFile).not.toHaveBeenCalled();
    expect(m.execute).not.toHaveBeenCalled();
  });

  it("only reads images directly inside images/", async () => {
    await restoreBackup(
      await zipFile({ "notes.json": backupJson([]), "images/a.png": "x", "images/deep/b.png": "y", "other/c.png": "z" })
    );
    expect(m.writeFile.mock.calls.map((c) => c[0])).toEqual(["images/a.png"]);
  });

  it.each(["has space.png", "a$b.png", "..", ".", "..."])("skips the unsafe image name %j", async (name) => {
    await restoreBackup(await zipFile({ "notes.json": backupJson([]), [`images/${name}`]: "x", "images/ok.png": "y" }));
    expect(m.writeFile.mock.calls.map((c) => c[0])).toEqual(["images/ok.png"]);
  });

  it("skips folders without an id or name", async () => {
    await restoreBackup(
      await zipFile({ "notes.json": backupJson([], [{ name: "x" }, { id: "a" }, { id: "b", name: "ok" }]) })
    );
    expect(m.execute).toHaveBeenCalledTimes(1);
    expect(m.execute.mock.calls[0][1][0]).toBe("b");
  });
});
