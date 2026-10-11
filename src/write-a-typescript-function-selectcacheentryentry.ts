// bloom-deps:

export function selectCacheEntry(
  entry: unknown,
  nowMs: number,
  ttlMs: number,
  staleMs: number
): 'fresh' | 'stale' | 'expired' | 'miss' {
  if (entry === null || entry === undefined) {
    return 'miss';
  }

  if (typeof entry !== 'object') {
    throw new TypeError('entry must be an object');
  }

  const record = entry as Record<string, unknown>;
  if (typeof record['storedAtMs'] !== 'number') {
    throw new TypeError('entry must have a numeric storedAtMs property');
  }

  const storedAtMs = record['storedAtMs'] as number;

  if (!Number.isFinite(nowMs)) {
    throw new RangeError('nowMs must be finite');
  }

  if (!Number.isFinite(ttlMs) || ttlMs < 0) {
    throw new RangeError('ttlMs must be a non-negative finite number');
  }

  if (!Number.isFinite(staleMs) || staleMs < 0) {
    throw new RangeError('staleMs must be a non-negative finite number');
  }

  const age = nowMs - storedAtMs;

  if (age < 0) {
    throw new RangeError('computed age (nowMs - storedAtMs) must not be negative');
  }

  if (age < ttlMs) {
    return 'fresh';
  }

  if (age < ttlMs + staleMs) {
    return 'stale';
  }

  return 'expired';
}