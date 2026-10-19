// bloom-deps:

export function slidingWindowCount(events: unknown, windowMs: number, nowMs: number): number {
  if (!Array.isArray(events)) {
    throw new TypeError('events must be an Array');
  }
  if (typeof windowMs !== 'number' || !isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError('windowMs must be a positive finite number');
  }
  if (events.length === 0) {
    return 0;
  }
  const lowerBound = nowMs - windowMs;
  let count = 0;
  for (const ts of events) {
    if ((ts as number) > lowerBound && (ts as number) <= nowMs) {
      count++;
    }
  }
  return count;
}