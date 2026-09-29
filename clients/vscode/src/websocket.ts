// bloom-deps:

export function hasTimedOut(startedAt: number, timeoutMs: number, now?: number): boolean {
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) {
    throw new TypeError('startedAt must be a finite number');
  }
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
    throw new TypeError('timeoutMs must be a finite number');
  }
  if (timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive number');
  }

  const currentTime = now !== undefined ? now : Date.now();
  return (currentTime - startedAt) >= timeoutMs;
}