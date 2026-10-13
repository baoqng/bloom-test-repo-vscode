// bloom-deps:

export function createTokenBucket(
  capacity: number,
  refillPerSecond: number,
  now: () => number
): { tryRemove(count?: number): boolean; available(): number } {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new RangeError(`capacity must be a positive integer, got ${capacity}`);
  }
  if (!Number.isFinite(refillPerSecond) || refillPerSecond <= 0) {
    throw new RangeError(`refillPerSecond must be a positive finite number, got ${refillPerSecond}`);
  }

  let tokens: number = capacity;
  let lastTimestamp: number = now();

  function refill(): void {
    const current = now();
    const elapsedMs = current - lastTimestamp;
    if (elapsedMs > 0) {
      tokens = Math.min(capacity, tokens + (elapsedMs / 1000) * refillPerSecond);
      lastTimestamp = current;
    } else {
      // now() went backwards or same instant — treat elapsed as 0, update timestamp only if forward
      // do not update lastTimestamp so future calls can still accumulate from the last valid time
    }
  }

  return {
    tryRemove(count: number = 1): boolean {
      if (!Number.isInteger(count) || count <= 0) {
        throw new RangeError(`count must be a positive integer, got ${count}`);
      }
      refill();
      if (tokens >= count) {
        tokens -= count;
        return true;
      }
      return false;
    },

    available(): number {
      refill();
      return Math.floor(tokens);
    },
  };
}