/** A lantern's angle in world space, driven by the velocity changes of its moving tie point. */
export function createPendulum(length: number, damping = 0.85) {
  let angle = 0, velocity = 0;
  let previous: { x: number; y: number } | undefined;
  let vx = 0, vy = 0;
  const gravity = 9.81 / length;
  return {
    get velocity() { return velocity; },
    step(dt: number, x: number, y: number, windAngle = 0) {
      if (!previous) {
        previous = { x, y };
        angle = windAngle;
        return angle;
      }
      if (dt <= 0) return angle;
      const d = Math.min(dt, 0.1);
      const nextVx = dt > 0.1 ? 0 : (x - previous.x) / d;
      const nextVy = dt > 0.1 ? 0 : (y - previous.y) / d;
      // Inertia: accelerating the branch right initially leaves the lantern behind it.
      const ax = (nextVx - vx) / d, ay = (nextVy - vy) / d;
      previous.x = x; previous.y = y;
      vx = nextVx; vy = nextVy;
      const steps = Math.ceil(d * 120), h = d / steps;
      for (let i = 0; i < steps; i++) {
        const inertia = -(ax * Math.cos(angle) + ay * Math.sin(angle)) / length;
        // A soft restoring force near the edge prevents wild swings under sustained clicking.
        const excess = Math.max(0, Math.abs(angle) - 0.35);
        const stop = Math.sign(angle) * excess * excess * 180;
        velocity += (gravity * Math.sin(windAngle - angle) - damping * velocity + inertia - stop) * h;
        velocity = Math.max(-3, Math.min(3, velocity));
        const next = angle + velocity * h;
        angle = Math.max(-0.6, Math.min(0.6, next));
        if (angle !== next) velocity *= -0.15;
      }
      return angle;
    },
  };
}
