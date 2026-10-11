// bloom-deps:

export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number
): { tryAcquire(): boolean; remaining(): number } {
  // Input validation
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError('limit must be a positive integer');
  }

  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError('windowMs must be a positive finite number');
  }

  if (typeof now !== 'function') {
    throw new TypeError('now must be a function');
  }

  const timestamps: number[] = [];

  function cleanWindow(): void {
    const currentTime = now();
    const windowStart = currentTime - windowMs;
    // Remove timestamps that are at or before the window start (exclusive lower bound)
    // Timestamps exactly at windowStart should be removed since window is (now - windowMs, now]
    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift();
    }
  }

  return {
    tryAcquire(): boolean {
      cleanWindow();
      const currentTime = now();

      if (timestamps.length < limit) {
        timestamps.push(currentTime);
        return true;
      }

      return false;
    },

    remaining(): number {
      cleanWindow();
      const count = timestamps.length;
      return Math.max(0, limit - count);
    }
  };
}