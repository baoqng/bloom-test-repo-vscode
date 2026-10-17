// bloom-deps:

export function createRateLimiter(requestsPerSecond: number): (nowMs: number) => boolean {
  if (typeof requestsPerSecond !== 'number' || isNaN(requestsPerSecond) || !isFinite(requestsPerSecond) || requestsPerSecond <= 0) {
    throw new TypeError(`requestsPerSecond must be a valid positive number, got: ${requestsPerSecond}`);
  }

  const capacity = Math.ceil(requestsPerSecond);
  let tokens = capacity;
  let lastCallMs: number | null = null;

  return function (nowMs: number): boolean {
    if (lastCallMs !== null) {
      const elapsedSeconds = (nowMs - lastCallMs) / 1000;
      if (elapsedSeconds > 0) {
        const refill = elapsedSeconds * requestsPerSecond;
        tokens = Math.min(capacity, tokens + refill);
      }
    }

    lastCallMs = nowMs;

    if (tokens >= 1) {
      tokens -= 1;
      return true;
    }

    return false;
  };
}