// bloom-deps:

export function computeBackoffDelay(
  attempt: unknown,
  baseMs: unknown,
  factor: unknown,
  maxMs: unknown
): number {
  // Type validation
  if (typeof attempt !== 'number') {
    throw new TypeError('attempt must be a number');
  }
  if (typeof baseMs !== 'number') {
    throw new TypeError('baseMs must be a number');
  }
  if (typeof factor !== 'number') {
    throw new TypeError('factor must be a number');
  }
  if (typeof maxMs !== 'number') {
    throw new TypeError('maxMs must be a number');
  }

  // Validate attempt: non-negative safe integer
  if (!Number.isInteger(attempt) || attempt < 0 || !Number.isSafeInteger(attempt)) {
    throw new RangeError('attempt must be a non-negative safe integer');
  }

  // Validate baseMs: finite and greater than 0
  if (!Number.isFinite(baseMs) || baseMs <= 0) {
    throw new RangeError('baseMs must be finite and greater than 0');
  }

  // Validate factor: finite and greater than or equal to 1
  if (!Number.isFinite(factor) || factor < 1) {
    throw new RangeError('factor must be finite and greater than or equal to 1');
  }

  // Validate maxMs: finite and not less than baseMs
  if (!Number.isFinite(maxMs) || maxMs < baseMs) {
    throw new RangeError('maxMs must be finite and not less than baseMs');
  }

  // Special case: attempt 0 returns baseMs
  if (attempt === 0) {
    return Math.floor(baseMs);
  }

  // Compute baseMs * factor ** attempt
  const uncapped = baseMs * Math.pow(factor, attempt);

  // Clamp to maxMs if it overflows or exceeds maxMs
  const clamped = uncapped > maxMs ? maxMs : uncapped;

  // Return floored result
  return Math.floor(clamped);
}