// bloom-deps:

export function createTokenBucket(
  capacity: number,
  refillPerSecond: number,
  startMs: number
): { tryRemove(count: number, nowMs: number): boolean; available(nowMs: number): number } {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new RangeError('capacity must be a positive integer');
  }
  if (!Number.isFinite(refillPerSecond) || refillPerSecond <= 0) {
    throw new RangeError('refillPerSecond must be a finite number greater than 0');
  }
  if (!Number.isFinite(startMs)) {
    throw new RangeError('startMs must be finite');
  }

  let tokens: number = capacity;
  let lastMs: number = startMs;
  let lastSeenMs: number = startMs;

  function computeAvailable(nowMs: number): number {
    const elapsedSec = (nowMs - lastMs) / 1000;
    const refilled = tokens + elapsedSec * refillPerSecond;
    return Math.min(capacity, refilled);
  }

  return {
    available(nowMs: number): number {
      return computeAvailable(nowMs);
    },

    tryRemove(count: number, nowMs: number): boolean {
      if (!Number.isInteger(count) || count <= 0 || count > capacity) {
        throw new RangeError('count must be a positive integer not exceeding capacity');
      }
      if (nowMs < lastSeenMs) {
        throw new RangeError('nowMs must not go backwards');
      }

      lastSeenMs = nowMs;

      const current = computeAvailable(nowMs);

      if (current < count) {
        return false;
      }

      tokens = current - count;
      lastMs = nowMs;
      return true;
    }
  };
}