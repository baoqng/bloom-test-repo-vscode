// bloom-deps:

export function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number' ||
      isNaN(value) || isNaN(min) || isNaN(max)) {
    throw new RangeError('value, min, and max must be valid numbers');
  }
  if (min > max) {
    throw new RangeError(`min (${min}) must not be greater than max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}