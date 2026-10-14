import { describe, expect, it } from "vitest";
import { shouldRunScene, type Env } from "./capabilities";

const ok: Env = { webgl: true, reducedMotion: false, width: 1280, coarsePointer: false };

describe("shouldRunScene", () => {
  it("runs on a capable desktop browser", () => {
    expect(shouldRunScene(ok)).toBe(true);
  });

  it("does not run when any single condition fails", () => {
    expect(shouldRunScene({ ...ok, webgl: false })).toBe(false);
    expect(shouldRunScene({ ...ok, reducedMotion: true })).toBe(false);
    expect(shouldRunScene({ ...ok, coarsePointer: true })).toBe(false);
    expect(shouldRunScene({ ...ok, width: 767 })).toBe(false);
  });

  it("treats 768 px as the first width that runs", () => {
    expect(shouldRunScene({ ...ok, width: 768 })).toBe(true);
  });
});
