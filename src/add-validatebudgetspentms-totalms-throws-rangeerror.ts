// bloom-deps:

export function validateBudget(spentMs: unknown, totalMs: unknown): true {
  if (
    typeof spentMs !== 'number' || !Number.isFinite(spentMs) ||
    typeof totalMs !== 'number' || !Number.isFinite(totalMs)
  ) {
    throw new TypeError('Both spentMs and totalMs must be finite numbers.');
  }

  if (spentMs < 0 || totalMs < 0) {
    throw new RangeError('Neither spentMs nor totalMs may be negative.');
  }

  if (spentMs >= totalMs) {
    throw new RangeError('spentMs must be strictly less than totalMs; the entire budget may not be spent.');
  }

  return true;
}