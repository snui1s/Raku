import { describe, expect, it } from "vitest";
import { BackSide, Color, Mesh, ShaderMaterial } from "three";
import { PALETTE } from "./palette";
import { SKY_VIOLET, buildSky } from "./sky";

const channels = (hex: number) => { const c = new Color(hex); return { r: c.r, g: c.g, b: c.b }; };
const uniforms = (m: Mesh) => (m.material as ShaderMaterial).uniforms;

describe("the sky colors", () => {
  it("are blue, and darker toward the top", () => {
    for (const hex of [PALETTE.skyHorizon, PALETTE.skyZenith, PALETTE.sky]) {
      const c = channels(hex);
      expect(c.b, hex.toString(16)).toBeGreaterThan(c.r * 1.5);
      expect(c.b).toBeGreaterThan(c.g * 1.1);
    }
    const lum = (hex: number) => { const c = channels(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
    expect(lum(PALETTE.skyZenith)).toBeLessThan(lum(PALETTE.skyHorizon));
  });
});

describe("buildSky", () => {
  it("is a big inside-out dome that never hides anything", () => {
    const { object } = buildSky(PALETTE);
    const mesh = object.getObjectByName("sky-dome") as Mesh;
    const mat = mesh.material as ShaderMaterial;
    expect(mat.side).toBe(BackSide);
    expect(mat.depthWrite).toBe(false);
    expect(mat.fog).toBe(false);
    expect(mesh.renderOrder).toBeLessThan(0);
  });

  it("uses the palette colors, and shifts toward violet when asked", () => {
    const sky = buildSky(PALETTE);
    const mesh = sky.object.getObjectByName("sky-dome") as Mesh;
    sky.setBlend(0);
    expect((uniforms(mesh).uHorizon.value as Color).getHex()).toBe(new Color(PALETTE.skyHorizon).getHex());
    expect((uniforms(mesh).uZenith.value as Color).getHex()).toBe(new Color(PALETTE.skyZenith).getHex());
    sky.setBlend(1);
    expect((uniforms(mesh).uZenith.value as Color).getHex()).toBe(new Color(SKY_VIOLET.zenith).getHex());
    sky.setBlend(0.5);
    const mid = uniforms(mesh).uHorizon.value as Color;
    expect(mid.getHex()).not.toBe(new Color(PALETTE.skyHorizon).getHex());
    expect(mid.getHex()).not.toBe(new Color(SKY_VIOLET.horizon).getHex());
  });

  it("clamps the blend", () => {
    const sky = buildSky(PALETTE);
    const mesh = sky.object.getObjectByName("sky-dome") as Mesh;
    sky.setBlend(5);
    expect((uniforms(mesh).uZenith.value as Color).getHex()).toBe(new Color(SKY_VIOLET.zenith).getHex());
    sky.setBlend(-3);
    expect((uniforms(mesh).uZenith.value as Color).getHex()).toBe(new Color(PALETTE.skyZenith).getHex());
  });

  it("reports the current fog color so far things fade into the sky", () => {
    const sky = buildSky(PALETTE);
    sky.setBlend(0);
    expect(sky.fogColor().getHex()).toBe(new Color(PALETTE.sky).getHex());
    sky.setBlend(1);
    expect(sky.fogColor().getHex()).toBe(new Color(SKY_VIOLET.fog).getHex());
  });
});
