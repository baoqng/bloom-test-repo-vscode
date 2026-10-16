// bloom-deps:

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function isWithinLast24Hours(timestampMs: number): boolean {
  if (typeof timestampMs !== 'number') return false;
  if (Number.isNaN(timestampMs)) return false;
  if (!Number.isFinite(timestampMs)) return false;
  if (timestampMs < 0) return false;

  const now = Date.now();
  return now - timestampMs < TWENTY_FOUR_HOURS_MS && timestampMs <= now;
}