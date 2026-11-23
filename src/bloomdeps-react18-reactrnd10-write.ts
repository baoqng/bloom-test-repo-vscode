// bloom-deps:
export function clampPercent(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Expected a finite number, got ${value}`);
  }
  return Math.min(Math.max(value, 0), 100);
}