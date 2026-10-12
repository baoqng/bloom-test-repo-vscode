// bloom-deps:

export function assertSessionOverhead(
  lifetimeMs: unknown,
  setupMs: unknown,
  teardownMs: unknown,
  graceMs: unknown
): number {
  if (
    typeof lifetimeMs !== 'number' || !isFinite(lifetimeMs) ||
    typeof setupMs !== 'number' || !isFinite(setupMs) ||
    typeof teardownMs !== 'number' || !isFinite(teardownMs) ||
    typeof graceMs !== 'number' || !isFinite(graceMs)
  ) {
    throw new TypeError('All arguments must be finite numbers');
  }

  if (lifetimeMs < 0) {
    throw new RangeError('lifetimeMs must not be negative');
  }
  if (setupMs < 0) {
    throw new RangeError('setupMs must not be negative');
  }
  if (teardownMs < 0) {
    throw new RangeError('teardownMs must not be negative');
  }
  if (graceMs < 0) {
    throw new RangeError('graceMs must not be negative');
  }

  if (lifetimeMs === 0) {
    throw new RangeError('lifetimeMs must not be 0');
  }

  const totalOverhead = setupMs + teardownMs + graceMs;

  if (totalOverhead >= lifetimeMs) {
    throw new RangeError(
      'setupMs + teardownMs + graceMs must not exceed lifetimeMs'
    );
  }

  return lifetimeMs - totalOverhead;
}