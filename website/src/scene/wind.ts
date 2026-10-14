/** Wind strength over time, 0 (calm) to 1 (strong gust). Swells come every ten seconds or so. */
export function windGust(t: number): number {
  const g = 0.5 + 0.5 * Math.sin(t * 0.42 + 2 * Math.sin(t * 0.11));
  return g * g * g;
}
