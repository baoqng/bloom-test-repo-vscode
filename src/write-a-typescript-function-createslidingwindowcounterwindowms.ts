// bloom-deps:

export function createSlidingWindowCounter(windowMs: number): { record(nowMs: number): void; count(nowMs: number): number } {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError('windowMs must be a positive finite number');
  }

  const timestamps: number[] = [];
  let maxNowMs: number = -Infinity;

  function validateNowMs(nowMs: number, method: string): void {
    if (!Number.isFinite(nowMs)) {
      throw new TypeError(`nowMs passed to ${method}() must be a finite number`);
    }
    if (Number.isFinite(maxNowMs) && nowMs < maxNowMs) {
      throw new RangeError(`nowMs passed to ${method}() must not be earlier than the largest nowMs previously passed to either method`);
    }
  }

  function discardOldEvents(nowMs: number): void {
    // Remove events where nowMs - t >= windowMs (i.e., t <= nowMs - windowMs)
    const cutoff = nowMs - windowMs;
    let i = 0;
    while (i < timestamps.length && timestamps[i] <= cutoff) {
      i++;
    }
    if (i > 0) {
      timestamps.splice(0, i);
    }
  }

  function updateMax(nowMs: number): void {
    if (!Number.isFinite(maxNowMs) || nowMs > maxNowMs) {
      maxNowMs = nowMs;
    }
  }

  return {
    record(nowMs: number): void {
      validateNowMs(nowMs, 'record');
      updateMax(nowMs);
      discardOldEvents(nowMs);
      // Insert in sorted order (since nowMs >= maxNowMs, append at end)
      timestamps.push(nowMs);
    },

    count(nowMs: number): number {
      validateNowMs(nowMs, 'count');
      updateMax(nowMs);
      discardOldEvents(nowMs);
      // Count events where nowMs - t < windowMs (strictly less than)
      // After discardOldEvents, all remaining timestamps satisfy t > nowMs - windowMs
      return timestamps.length;
    }
  };
}