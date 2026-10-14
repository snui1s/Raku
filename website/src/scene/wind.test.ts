import { describe, expect, it } from "vitest";
import { windGust } from "./wind";

describe("windGust", () => {
  const samples = Array.from({ length: 7200 }, (_, i) => windGust(i / 60)); // two minutes at 60 fps

  it("stays within 0..1", () => {
    for (const g of samples) {
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(1);
    }
  });

  it("has calm stretches and real gusts", () => {
    expect(Math.min(...samples)).toBeLessThan(0.1);
    expect(Math.max(...samples)).toBeGreaterThan(0.7);
  });

  it("changes smoothly from frame to frame", () => {
    for (let i = 1; i < samples.length; i++) expect(Math.abs(samples[i] - samples[i - 1])).toBeLessThan(0.02);
  });

  it("is deterministic", () => {
    expect(windGust(12.34)).toBe(windGust(12.34));
  });
});
