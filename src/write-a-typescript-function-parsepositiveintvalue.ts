// bloom-deps:

export function parsePositiveInt(value: unknown, name: string): number {
  if (typeof value !== 'number') {
    throw new TypeError(`${name} must be a number`);
  }
  if (Number.isNaN(value)) {
    throw new TypeError(`${name} must not be NaN`);
  }
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer`);
  }
  if (value <= 0) {
    throw new RangeError(`${name} must be positive`);
  }
  return value;
}