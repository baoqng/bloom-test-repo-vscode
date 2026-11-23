// bloom-deps:
export function clampRange(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(lo) || !Number.isFinite(hi)) {
    throw new TypeError(
      'clampRange: all arguments must be finite numbers'
    );
  }
  if (value < lo) {
    return lo;
  }
  if (value > hi) {
    return hi;
  }
  return value;
}