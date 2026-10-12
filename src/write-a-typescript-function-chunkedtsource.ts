// bloom-deps:

export function chunked<T>(source: Iterable<T>, size: number): Iterable<T[]> {
  // Input validation: check source
  if (source === null || source === undefined) {
    throw new TypeError('source must not be null or undefined');
  }

  if (typeof source[Symbol.iterator] !== 'function') {
    throw new TypeError('source must be iterable (have a callable [Symbol.iterator])');
  }

  // Input validation: check size
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || !Number.isSafeInteger(size)) {
    throw new RangeError('size must be a positive safe integer');
  }

  // Return a reusable iterable object
  return {
    [Symbol.iterator]() {
      return (function* () {
        let chunk: T[] = [];

        for (const element of source) {
          chunk.push(element);

          if (chunk.length === size) {
            yield [...chunk]; // yield a new array instance
            chunk = [];
          }
        }

        // Yield the last chunk if it has any elements
        if (chunk.length > 0) {
          yield [...chunk]; // yield a new array instance
        }
      })();
    }
  };
}