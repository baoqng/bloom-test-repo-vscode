// bloom-deps:

export function asyncPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks must be an array');
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }

  return new Promise<T[]>((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    const results = new Array<T>(tasks.length);
    let nextIndex = 0;
    let settledCount = 0;
    let startedCount = 0;
    let firstError: { hasError: true; value: unknown; taskIndex: number } | undefined;
    let firstErrorIndex = Infinity;

    function onSettle() {
      settledCount++;
      if (settledCount === startedCount && nextIndex >= tasks.length) {
        // All started tasks have settled
        if (firstError !== undefined) {
          reject(firstError.value);
        } else {
          resolve(results);
        }
        return;
      }
      // Start next task if available
      startNext();
    }

    function startNext() {
      while (nextIndex < tasks.length && startedCount - settledCount < concurrency) {
        const taskIndex = nextIndex++;
        startedCount++;
        const task = tasks[taskIndex];
        let p: Promise<T>;
        try {
          p = task();
        } catch (err) {
          // Synchronous throw — treat as rejection
          p = Promise.reject(err);
        }
        p.then(
          (value) => {
            results[taskIndex] = value;
            onSettle();
          },
          (err) => {
            if (taskIndex < firstErrorIndex) {
              firstErrorIndex = taskIndex;
              firstError = { hasError: true, value: err, taskIndex };
            }
            onSettle();
          }
        );
      }
    }

    startNext();
  });
}