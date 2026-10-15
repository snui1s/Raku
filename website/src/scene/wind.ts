let pushed = 0; // extra wind on top of the natural gusts, from the visitor's pointer

/** Wind strength over time, 0 (calm) to 1 (strong gust). Swells come every ten seconds or so; moving the pointer
 *  across the scene adds to it for a moment (see `pushWind`). */
export function windGust(t: number): number {
  const g = 0.5 + 0.5 * Math.sin(t * 0.42 + 2 * Math.sin(t * 0.11));
  return Math.min(1, g * g * g + pushed);
}

/** Adds wind (0..1 in total): a quick sweep of the pointer calls this, and it fades by itself (see `decayWind`). */
export function pushWind(amount: number): void {
  if (amount > 0) pushed = Math.min(1, pushed + amount);
}

/** Lets the pushed wind die down; call once per frame with the frame time in seconds. */
export function decayWind(dt: number): void {
  pushed *= Math.exp(-Math.max(0, dt) * 1.8);
  if (pushed < 0.002) pushed = 0;
}

/** How much wind the pointer is adding right now (for tests and the readout). */
export function pushedWind(): number {
  return pushed;
}
