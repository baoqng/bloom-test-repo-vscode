// bloom-deps:

export function isTokenExpired(expiresAtMs: unknown, nowMs: unknown, skewMs: unknown = 0): boolean {
  // Type validation
  if (typeof expiresAtMs !== 'number') {
    throw new TypeError('expiresAtMs must be a number');
  }
  if (typeof nowMs !== 'number') {
    throw new TypeError('nowMs must be a number');
  }
  if (typeof skewMs !== 'number') {
    throw new TypeError('skewMs must be a number');
  }

  // NaN validation
  if (Number.isNaN(expiresAtMs)) {
    throw new RangeError('expiresAtMs must not be NaN');
  }
  if (Number.isNaN(nowMs)) {
    throw new RangeError('nowMs must not be NaN');
  }
  if (Number.isNaN(skewMs)) {
    throw new RangeError('skewMs must not be NaN');
  }

  // Infinity validation
  if (!Number.isFinite(expiresAtMs)) {
    throw new RangeError('expiresAtMs must be finite');
  }
  if (!Number.isFinite(nowMs)) {
    throw new RangeError('nowMs must be finite');
  }
  if (!Number.isFinite(skewMs)) {
    throw new RangeError('skewMs must be finite');
  }

  // Negative skew validation
  if (skewMs < 0) {
    throw new RangeError('skewMs must not be negative');
  }

  // A token is expired when nowMs + skewMs >= expiresAtMs
  return nowMs + skewMs >= expiresAtMs;
}