// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

const fs = vi.hoisted(() => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  exists: vi.fn(),
  readDir: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-fs", () => ({ BaseDirectory: { AppData: 1 }, ...fs }));
vi.mock("@tauri-apps/plugin-sql", () => ({ default: class {} }));

import { saveImage, runGarbageCollection } from "./imageUtils";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  fs.exists.mockResolvedValue(true);
  fs.writeFile.mockResolvedValue(undefined);
  fs.mkdir.mockResolvedValue(undefined);
  fs.remove.mockResolvedValue(undefined);
});

describe("saveImage", () => {
  const blob = (type: string) => new Blob([new Uint8Array([1, 2, 3])], { type });

  it("writes the image under a new uuid name and returns a local-image URL", async () => {
    const url = await saveImage(blob("image/png"));
    expect(url).toMatch(new RegExp(`^local-image:images/${UUID}\\.png$`));
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile.mock.calls[0][0]).toBe(url.replace("local-image:", ""));
    expect(fs.writeFile.mock.calls[0][1]).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("gives two images two different names", async () => {
    expect(await saveImage(blob("image/png"))).not.toBe(await saveImage(blob("image/png")));
  });

  it("creates the images folder when it is missing", async () => {
    fs.exists.mockResolvedValue(false);
    await saveImage(blob("image/png"));
    expect(fs.mkdir).toHaveBeenCalledWith("images", { baseDir: 1, recursive: true });
  });

  it("does not create the folder when it exists", async () => {
    await saveImage(blob("image/png"));
    expect(fs.mkdir).not.toHaveBeenCalled();
  });

  it.each([
    ["image/jpeg", "jpeg"],
    ["image/svg+xml", "svg"],
    ["image/WEBP", "webp"],
    ["", "png"],
    ["image", "png"],
    ["image/../../evil", "png"],
    ["image/toolongext", "png"],
  ])("uses a safe extension for the type %j", async (type, ext) => {
    const url = await saveImage(blob(type));
    expect(url.endsWith(`.${ext}`)).toBe(true);
    expect(url).toMatch(new RegExp(`^local-image:images/${UUID}\\.[a-z0-9]{1,5}$`));
  });

  it("falls back to a data URL when the file can not be written", async () => {
    fs.writeFile.mockRejectedValue(new Error("disk full"));
    const url = await saveImage(blob("image/png"));
    expect(url).toMatch(/^data:image\/png;base64,/);
  });
});

describe("runGarbageCollection", () => {
  const dbWith = (contents: string[]) => ({
    select: vi.fn().mockResolvedValue(contents.map((content) => ({ content }))),
  });
  const A = "11111111-1111-1111-1111-111111111111";
  const B = "22222222-2222-2222-2222-222222222222";
  const files = (...names: string[]) => names.map((name) => ({ name, isFile: true }));

  it("removes images that no note uses and keeps the ones that are used", async () => {
    fs.readDir.mockResolvedValue(files(`${A}.png`, `${B}.png`));
    await runGarbageCollection(dbWith([`{"src":"local-image:images/${A}.png"}`]) as never);
    expect(fs.remove).toHaveBeenCalledTimes(1);
    expect(fs.remove).toHaveBeenCalledWith(`images/${B}.png`, { baseDir: 1 });
  });

  it("keeps an image that is used by any one of the notes", async () => {
    fs.readDir.mockResolvedValue(files(`${A}.png`));
    await runGarbageCollection(dbWith(["nothing here", `see ${A}`, "other"]) as never);
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it("leaves folders alone", async () => {
    fs.readDir.mockResolvedValue([{ name: "sub", isFile: false }, ...files(`${A}.png`)]);
    await runGarbageCollection(dbWith([]) as never);
    expect(fs.remove).toHaveBeenCalledTimes(1);
    expect(fs.remove.mock.calls[0][0]).toBe(`images/${A}.png`);
  });

  it("does nothing when there is no images folder", async () => {
    fs.exists.mockResolvedValue(false);
    await runGarbageCollection(dbWith([]) as never);
    expect(fs.readDir).not.toHaveBeenCalled();
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it("removes nothing when the notes can not be read", async () => {
    fs.readDir.mockResolvedValue(files(`${A}.png`));
    const db = { select: vi.fn().mockRejectedValue(new Error("locked")) };
    await runGarbageCollection(db as never);
    expect(fs.remove).not.toHaveBeenCalled();
  });

  it("keeps going when one file can not be removed", async () => {
    fs.readDir.mockResolvedValue(files(`${A}.png`, `${B}.png`));
    fs.remove.mockRejectedValueOnce(new Error("gone"));
    await runGarbageCollection(dbWith([]) as never);
    expect(fs.remove).toHaveBeenCalledTimes(2);
  });

  it("treats a note without content as having no images", async () => {
    fs.readDir.mockResolvedValue(files(`${A}.png`));
    const db = { select: vi.fn().mockResolvedValue([{ content: null }]) };
    await runGarbageCollection(db as never);
    expect(fs.remove).toHaveBeenCalledTimes(1);
  });
});
