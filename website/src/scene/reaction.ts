/** A local damped motion. A click adds velocity without resetting the current pose or phase. */
export function createReaction(frequency: number, decay: number) {
  let position = 0, velocity = 0;
  return {
    kick() {
      // Cap the wave's total amplitude, including its current displacement, even under rapid clicks.
      const limit = frequency * Math.sqrt(Math.max(0, 1 - position * position));
      velocity = Math.min(limit, velocity + decay * position + frequency) - decay * position;
    },
    step(dt: number) {
      const d = Math.max(0, dt);
      const fade = Math.exp(-decay * d), c = Math.cos(frequency * d), s = Math.sin(frequency * d);
      const waveVelocity = velocity + decay * position;
      const next = fade * (position * c + waveVelocity / frequency * s);
      velocity = fade * (waveVelocity * c - position * frequency * s) - decay * next;
      position = next;
      return position;
    },
  };
}
