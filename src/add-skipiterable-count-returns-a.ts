// bloom-deps:

export function skip<T>(iterable: Iterable<T>, count: number): Iterable<T> {
  if (iterable == null || typeof (iterable as any)[Symbol.iterator] !== 'function') {
    throw new TypeError('First argument must be iterable');
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer');
  }

  return {
    [Symbol.iterator](): Iterator<T> {
      const iter = iterable[Symbol.iterator]();
      let skipped = 0;

      while (skipped < count) {
        const result = iter.next();
        if (result.done) {
          break;
        }
        skipped++;
      }

      return iter;
    }
  };
}