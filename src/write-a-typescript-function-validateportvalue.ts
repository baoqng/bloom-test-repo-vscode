// bloom-deps:

export function validatePort(value: unknown): number {
  if (typeof value !== 'number') {
    throw new TypeError('port must be a number');
  }
  if (Number.isNaN(value)) {
    throw new TypeError('port must not be NaN');
  }
  if (!Number.isInteger(value)) {
    throw new TypeError('port must be an integer');
  }
  if (value < 1 || value > 65535) {
    throw new RangeError('port must be between 1 and 65535');
  }
  return value;
}