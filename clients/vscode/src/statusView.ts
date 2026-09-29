// bloom-deps:

export function formatCostUsd(cents: number): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) {
    throw new TypeError('cents must be a finite number');
  }
  if (cents < 0 || !Number.isInteger(cents)) {
    throw new RangeError('cents must be a non-negative integer');
  }
  const dollars = cents / 100;
  return '$' + dollars.toFixed(2);
}