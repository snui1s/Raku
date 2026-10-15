import { describe, expect, it } from "vitest";
import { decayWind, pushWind, pushedWind, windGust } from "./wind";

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

describe("pointer wind", () => {
  it("adds to the gust, never past 1, and dies down by itself", () => {
    decayWind(100); // start calm
    const t = 3.3, base = windGust(t);
    pushWind(0.4);
    expect(windGust(t)).toBeGreaterThan(base);
    pushWind(5);
    expect(windGust(t)).toBeLessThanOrEqual(1);
    expect(pushedWind()).toBe(1);
    for (let i = 0; i < 240; i++) decayWind(1 / 60); // four seconds
    expect(pushedWind()).toBe(0);
    expect(windGust(t)).toBe(base);
  });

  it("ignores negative pushes and negative time", () => {
    decayWind(100);
    pushWind(-1);
    expect(pushedWind()).toBe(0);
    pushWind(0.5);
    decayWind(-3);
    expect(pushedWind()).toBe(0.5);
  });

  it("fades smoothly rather than switching off", () => {
    decayWind(100);
    pushWind(0.6);
    let prev = pushedWind();
    for (let i = 0; i < 120; i++) {
      decayWind(1 / 60);
      const now = pushedWind();
      expect(now).toBeLessThanOrEqual(prev);
      expect(prev - now).toBeLessThan(0.05);
      prev = now;
    }
  });
});
