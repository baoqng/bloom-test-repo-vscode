// bloom-deps:

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function isWithin24Hours(timestamp: number): boolean {
  if (typeof timestamp !== 'number') {
    return false;
  }
  if (!isFinite(timestamp)) {
    return false;
  }
  const now = Date.now();
  return now - timestamp < TWENTY_FOUR_HOURS_MS && timestamp <= now;
}