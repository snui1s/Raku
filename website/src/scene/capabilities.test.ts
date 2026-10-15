import { describe, expect, it } from "vitest";
import { adaptPixelRatioScale, cappedPixelRatio, detectEnv, isSoftwareRenderer, shouldGiveUp, shouldRunScene, type Env } from "./capabilities";

const ok: Env = { webgl: true, softwareRenderer: false, reducedMotion: false, width: 1280, coarsePointer: false };

describe("shouldRunScene", () => {
  it("runs on a capable desktop browser", () => {
    expect(shouldRunScene(ok)).toBe(true);
  });

  it("does not run when any single condition fails", () => {
    expect(shouldRunScene({ ...ok, webgl: false })).toBe(false);
    expect(shouldRunScene({ ...ok, softwareRenderer: true })).toBe(false);
    expect(shouldRunScene({ ...ok, reducedMotion: true })).toBe(false);
    expect(shouldRunScene({ ...ok, coarsePointer: true })).toBe(false);
    expect(shouldRunScene({ ...ok, width: 767 })).toBe(false);
  });

  it("treats 768 px as the first width that runs", () => {
    expect(shouldRunScene({ ...ok, width: 768 })).toBe(true);
  });
});

describe("cappedPixelRatio", () => {
  it("caps at 2 and falls back to 1 for missing or invalid values", () => {
    expect(cappedPixelRatio(1)).toBe(1);
    expect(cappedPixelRatio(1.5)).toBe(1.5);
    expect(cappedPixelRatio(3)).toBe(2);
    expect(cappedPixelRatio(0)).toBe(1);
    expect(cappedPixelRatio(Number.NaN)).toBe(1);
    expect(cappedPixelRatio(undefined)).toBe(1);
  });
});

describe("adaptPixelRatioScale", () => {
  it("lowers the render scale when frames are slow, never below the floor", () => {
    expect(adaptPixelRatioScale(1, 40)).toBe(0.75);
    expect(adaptPixelRatioScale(0.75, 40)).toBe(0.6);
    expect(adaptPixelRatioScale(0.6, 80)).toBe(0.6);
  });

  it("keeps the scale when the frame rate is fine", () => {
    expect(adaptPixelRatioScale(1, 16.7)).toBe(1);
    expect(adaptPixelRatioScale(0.75, 20)).toBe(0.75);
  });

  it("ignores nonsense frame times", () => {
    expect(adaptPixelRatioScale(1, Number.NaN)).toBe(1);
    expect(adaptPixelRatioScale(1, 0)).toBe(1);
  });
});

describe("isSoftwareRenderer", () => {
  it("recognises renderers that draw on the CPU", () => {
    expect(isSoftwareRenderer("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)")).toBe(true);
    expect(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true);
    expect(isSoftwareRenderer("Microsoft Basic Render Driver")).toBe(true);
    expect(isSoftwareRenderer("Software Rasterizer")).toBe(true);
  });

  it("does not take a real graphics chip for software", () => {
    expect(isSoftwareRenderer("ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe(false);
    expect(isSoftwareRenderer("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe(false);
    expect(isSoftwareRenderer("Apple M2")).toBe(false);
    expect(isSoftwareRenderer("")).toBe(false);
  });
});

describe("shouldGiveUp", () => {
  it("gives up when frames take more than 100 ms, at any resolution", () => {
    expect(shouldGiveUp(250, 1)).toBe(true);
    expect(shouldGiveUp(101, 0.75)).toBe(true);
  });

  it("gives up when frames are still slower than 60 ms at the lowest resolution", () => {
    expect(shouldGiveUp(70, 0.6)).toBe(true);
    expect(shouldGiveUp(70, 1)).toBe(false); // not yet: the resolution can still come down
  });

  it("keeps running a machine that is slow but usable, and a fast one", () => {
    expect(shouldGiveUp(40, 0.6)).toBe(false); // 25 fps at the floor
    expect(shouldGiveUp(16.7, 1)).toBe(false);
  });

  it("ignores nonsense frame times", () => {
    expect(shouldGiveUp(Number.NaN, 0.6)).toBe(false);
    expect(shouldGiveUp(0, 0.6)).toBe(false);
  });
});

describe("detectEnv", () => {
  // a window with working WebGL on a real chip
  const win = (search: string) => ({
    location: { search },
    innerWidth: 1280,
    matchMedia: () => ({ matches: false }),
    document: { createElement: () => ({ getContext: () => ({ getExtension: () => null }) }) },
  }) as unknown as Window;

  it("finds WebGL on a capable window", () => {
    expect(detectEnv(win("")).webgl).toBe(true);
    expect(shouldRunScene(detectEnv(win("")))).toBe(true);
  });

  it("shows the plain page for ?plain, even where WebGL works", () => {
    expect(detectEnv(win("?plain")).webgl).toBe(false);
    expect(shouldRunScene(detectEnv(win("?plain")))).toBe(false);
    expect(shouldRunScene(detectEnv(win("?x=1&plain&3d")))).toBe(false); // plain wins over 3d
  });
});
