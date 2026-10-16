// bloom-deps:

export function skip<T>(source: Iterable<T>, count: number): Iterable<T> {
  if (source === null || source === undefined || typeof (source as any)[Symbol.iterator] !== 'function') {
    throw new TypeError('source must be iterable');
  }

  if (
    typeof count !== 'number' ||
    !Number.isFinite(count) ||
    !Number.isInteger(count) ||
    count < 0
  ) {
    throw new TypeError('count must be a non-negative integer');
  }

  return {
    [Symbol.iterator](): Iterator<T> {
      function* generate(): Generator<T> {
        let skipped = 0;
        for (const item of source) {
          if (skipped < count) {
            skipped++;
            continue;
          }
          yield item;
        }
      }
      return generate();
    },
  };
}