// bloom-deps:

export function clampToRange(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number' ||
      isNaN(value) || isNaN(min) || isNaN(max)) {
    throw new RangeError('min must not exceed max');
  }
  if (min > max) {
    throw new RangeError('min must not exceed max');
  }
  return Math.min(Math.max(value, min), max);
}