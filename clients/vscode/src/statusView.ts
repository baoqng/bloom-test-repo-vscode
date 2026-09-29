// bloom-deps:

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function isStaleIndex(lastIndexedAt: number, now?: number): boolean {
  if (typeof lastIndexedAt !== 'number' || !Number.isFinite(lastIndexedAt)) {
    throw new TypeError('lastIndexedAt must be a finite number');
  }

  let resolvedNow: number;
  if (now !== undefined) {
    if (typeof now !== 'number' || !Number.isFinite(now)) {
      throw new TypeError('now must be a finite number');
    }
    resolvedNow = now;
  } else {
    resolvedNow = Date.now();
  }

  return (resolvedNow - lastIndexedAt) > TWENTY_FOUR_HOURS_MS;
}