// bloom-deps:

function take<T>(source: Iterable<T>, count: number): Iterable<T> {
  if (
    source === null ||
    source === undefined ||
    typeof source !== 'object' && typeof source !== 'string' ||
    typeof (source as any)[Symbol.iterator] !== 'function'
  ) {
    throw new TypeError('source must be iterable');
  }

  if (
    typeof count !== 'number' ||
    Number.isNaN(count) ||
    !Number.isFinite(count) ||
    count < 0 ||
    !Number.isInteger(count)
  ) {
    throw new TypeError('count must be a non-negative integer');
  }

  return {
    [Symbol.iterator]() {
      function* generator() {
        if (count <= 0) return;
        let remaining = count;
        for (const item of source) {
          yield item;
          remaining--;
          if (remaining <= 0) break;
        }
      }
      return generator();
    }
  };
}

export { take };