// bloom-deps:

export function range(start: number, end: number, step: number = 1): Iterable<number> {
  // Type validation
  if (typeof start !== 'number') {
    throw new TypeError('start must be a number');
  }
  if (typeof end !== 'number') {
    throw new TypeError('end must be a number');
  }
  if (typeof step !== 'number') {
    throw new TypeError('step must be a number');
  }

  // Finiteness validation
  if (!Number.isFinite(start)) {
    throw new RangeError('start must be finite');
  }
  if (!Number.isFinite(end)) {
    throw new RangeError('end must be finite');
  }
  if (!Number.isFinite(step)) {
    throw new RangeError('step must be finite');
  }

  // Step validation
  if (step === 0) {
    throw new RangeError('step must not be 0');
  }

  return {
    [Symbol.iterator]() {
      return (function* () {
        if (step > 0) {
          for (let i = start; i < end; i += step) {
            yield i;
          }
        } else {
          for (let i = start; i > end; i += step) {
            yield i;
          }
        }
      })();
    }
  };
}