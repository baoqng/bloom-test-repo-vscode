// bloom-deps:

export function backoffDelay(
  attempt: unknown,
  baseMs: unknown,
  maxMs: unknown,
  jitter: unknown
): number {
  // Type validation
  if (typeof attempt !== 'number') {
    throw new TypeError('attempt must be a number');
  }
  if (typeof baseMs !== 'number') {
    throw new TypeError('baseMs must be a number');
  }
  if (typeof maxMs !== 'number') {
    throw new TypeError('maxMs must be a number');
  }
  if (typeof jitter !== 'number') {
    throw new TypeError('jitter must be a number');
  }

  // Range validation for attempt
  if (!Number.isInteger(attempt)) {
    throw new RangeError('attempt must be an integer');
  }
  if (attempt < 0) {
    throw new RangeError('attempt must be >= 0');
  }

  // Range validation for baseMs
  if (!Number.isFinite(baseMs)) {
    throw new RangeError('baseMs must be finite');
  }
  if (baseMs <= 0) {
    throw new RangeError('baseMs must be > 0');
  }

  // Range validation for maxMs
  if (!Number.isFinite(maxMs)) {
    throw new RangeError('maxMs must be finite');
  }
  if (maxMs <= 0) {
    throw new RangeError('maxMs must be > 0');
  }

  // Validation for maxMs >= baseMs
  if (maxMs < baseMs) {
    throw new RangeError('maxMs must be >= baseMs');
  }

  // Range validation for jitter
  if (Number.isNaN(jitter)) {
    throw new RangeError('jitter must not be NaN');
  }
  if (jitter < 0 || jitter > 1) {
    throw new RangeError('jitter must be in the range [0, 1]');
  }

  // Compute raw = baseMs * 2^attempt, handling potential overflow
  const raw = attempt > 60
    ? Infinity
    : baseMs * Math.pow(2, attempt);

  // Cap at maxMs
  const capped = Math.min(raw, maxMs);

  // Return Math.floor(capped * (1 - jitter / 2))
  return Math.floor(capped * (1 - jitter / 2));
}