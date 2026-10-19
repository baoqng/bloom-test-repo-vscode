// bloom-deps:

function asyncPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  if (!Array.isArray(tasks)) {
    return Promise.reject(new TypeError('tasks must be an array'));
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    return Promise.reject(new RangeError('concurrency must be a positive integer'));
  }

  return new Promise<T[]>((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;
    let settledCount = 0;
    let startedCount = 0;
    let firstError: { value: unknown; index: number } | undefined;

    function onTaskSettled(index: number, result: { ok: true; value: T } | { ok: false; error: unknown }) {
      if (result.ok) {
        results[index] = result.value;
      } else {
        if (firstError === undefined || index < firstError.index) {
          firstError = { value: result.error, index };
        }
      }

      settledCount++;

      // Start next queued task immediately
      if (nextIndex < tasks.length) {
        const taskIndex = nextIndex++;
        startedCount++;
        runTask(taskIndex);
      }

      // All started tasks have settled
      if (settledCount === startedCount) {
        if (firstError !== undefined) {
          reject(firstError.value);
        } else {
          resolve(results);
        }
      }
    }

    function runTask(index: number): void {
      let p: Promise<T>;
      try {
        p = tasks[index]();
      } catch (e) {
        // Synchronous throw from task factory treated as rejection
        onTaskSettled(index, { ok: false, error: e });
        return;
      }

      Promise.resolve(p).then(
        (value) => {
          onTaskSettled(index, { ok: true, value });
        },
        (error) => {
          onTaskSettled(index, { ok: false, error });
        }
      );
    }

    // Start up to concurrency tasks
    const initialCount = Math.min(concurrency, tasks.length);
    startedCount = initialCount;
    for (let i = 0; i < initialCount; i++) {
      nextIndex = initialCount;
      runTask(i);
    }
    // Fix: set nextIndex after loop
    nextIndex = initialCount;
  });
}

export { asyncPool };
