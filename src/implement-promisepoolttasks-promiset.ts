// bloom-deps:

export function promisePool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<PromiseSettledResult<T>[]> {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks must be an array');
  }
  for (let i = 0; i < tasks.length; i++) {
    if (typeof tasks[i] !== 'function') {
      throw new TypeError(`tasks[${i}] is not a function`);
    }
  }
  if (!Number.isFinite(concurrency) || !Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a finite integer >= 1');
  }

  if (tasks.length === 0) {
    return Promise.resolve([]);
  }

  return new Promise<PromiseSettledResult<T>[]>((resolve) => {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length);
    let nextIndex = 0;
    let completed = 0;
    const total = tasks.length;
    const slots = Math.min(concurrency, total);

    function runNext(): void {
      if (nextIndex >= total) {
        return;
      }
      const index = nextIndex++;

      let taskPromise: Promise<T>;
      try {
        taskPromise = tasks[index]();
      } catch (err) {
        results[index] = { status: 'rejected', reason: err };
        completed++;
        if (completed === total) {
          resolve(results);
        } else {
          runNext();
        }
        return;
      }

      Promise.resolve(taskPromise).then(
        (value) => {
          results[index] = { status: 'fulfilled', value };
          completed++;
          if (completed === total) {
            resolve(results);
          } else {
            runNext();
          }
        },
        (reason) => {
          results[index] = { status: 'rejected', reason };
          completed++;
          if (completed === total) {
            resolve(results);
          } else {
            runNext();
          }
        }
      );
    }

    for (let i = 0; i < slots; i++) {
      runNext();
    }
  });
}