// bloom-deps:

export function isWithinRetentionWindow(
  timestampMs: unknown,
  nowMs: unknown,
  windowMs: unknown
): boolean {
  if (
    typeof timestampMs !== 'number' ||
    typeof nowMs !== 'number' ||
    typeof windowMs !== 'number'
  ) {
    return false;
  }

  if (!isFinite(timestampMs) || !isFinite(nowMs) || !isFinite(windowMs)) {
    return false;
  }

  if (windowMs <= 0) {
    return false;
  }

  if (timestampMs > nowMs) {
    return false;
  }

  const age = nowMs - timestampMs;
  return age < windowMs;
}