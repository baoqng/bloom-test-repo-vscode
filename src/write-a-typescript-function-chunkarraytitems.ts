// bloom-deps:

export function chunkArray<T>(items: unknown, size: unknown): T[][] {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (!Number.isFinite(size) || !Number.isInteger(size) || size < 1) {
    throw new RangeError('size must be a finite integer greater than or equal to 1');
  }

  const result: T[][] = [];
  const arr = items as T[];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
}