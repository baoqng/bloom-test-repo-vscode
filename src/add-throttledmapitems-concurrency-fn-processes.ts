// bloom-deps:

export function throttledMap<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }

  return new Promise<R[]>((resolve, reject) => {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    let inFlight = 0;
    let rejected = false;
    let settled = false;

    if (items.length === 0) {
      resolve(results);
      return;
    }

    function trySettle() {
      if (!settled && inFlight === 0 && nextIndex >= items.length) {
        settled = true;
        resolve(results);
      }
    }

    function startNext() {
      while (!rejected && inFlight < concurrency && nextIndex < items.length) {
        const index = nextIndex++;
        inFlight++;

        fn(items[index]).then(
          (value) => {
            inFlight--;
            if (rejected) {
              return;
            }
            results[index] = value;
            startNext();
            trySettle();
          },
          (error) => {
            inFlight--;
            if (rejected) {
              return;
            }
            rejected = true;
            settled = true;
            reject(error);
          }
        );
      }
    }

    startNext();
  });
}