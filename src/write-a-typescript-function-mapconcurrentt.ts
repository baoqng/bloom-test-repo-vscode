// bloom-deps:

function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }
  if (typeof mapper !== 'function') {
    throw new TypeError('mapper must be a function');
  }
  if (
    !Number.isInteger(limit) ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    throw new RangeError('limit must be a positive safe integer');
  }

  if (items.length === 0) {
    return Promise.resolve([]);
  }

  return new Promise<R[]>((resolve, reject) => {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;
    let rejected = false;
    let activeCount = 0;
    let settledCount = 0;
    const total = items.length;

    function onReject(reason: unknown): void {
      if (!rejected) {
        rejected = true;
        reject(reason);
      }
    }

    function onSuccess(index: number, value: R): void {
      if (!rejected) {
        results[index] = value;
      }
      settledCount++;
      if (!rejected && settledCount === total) {
        resolve(results);
      } else if (!rejected) {
        scheduleNext();
      }
    }

    function runOne(index: number): void {
      activeCount++;
      let p: Promise<R>;
      try {
        p = mapper(items[index], index);
        if (!(p instanceof Promise)) {
          p = Promise.resolve(p as unknown as R);
        }
      } catch (err) {
        activeCount--;
        settledCount++;
        onReject(err);
        return;
      }

      p.then(
        (value: R) => {
          activeCount--;
          onSuccess(index, value);
        },
        (reason: unknown) => {
          activeCount--;
          settledCount++;
          onReject(reason);
          // If other tasks were in flight and we're the last to settle, check
          if (rejected && settledCount === total) {
            // all done, rejection already fired
          } else if (!rejected) {
            scheduleNext();
          }
        }
      );
    }

    function scheduleNext(): void {
      while (!rejected && activeCount < limit && nextIndex < total) {
        const idx = nextIndex++;
        runOne(idx);
      }
    }

    scheduleNext();
  });
}

export { mapConcurrent };