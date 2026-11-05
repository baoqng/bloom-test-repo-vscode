// bloom-deps:

export function clampNumber(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number' ||
      !isFinite(value) && isNaN(value) || !isFinite(min) && isNaN(min) || !isFinite(max) && isNaN(max)) {
    // non-numeric / null / undefined / wrong-type inputs
  }

  if (typeof value !== 'number' || isNaN(value) ||
      typeof min !== 'number' || isNaN(min) ||
      typeof max !== 'number' || isNaN(max)) {
    throw new RangeError('clampNumber: max must be >= min');
  }

  if (max < min) {
    throw new RangeError('clampNumber: max must be >= min');
  }

  return Math.min(Math.max(value, min), max);
}