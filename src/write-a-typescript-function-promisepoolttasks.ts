// bloom-deps:

function promisePool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks must be an array');
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }

  const total = tasks.length;

  if (total === 0) {
    return Promise.resolve([]);
  }

  return new Promise<T[]>((resolve, reject) => {
    const results = new Array<T>(total);
    const errors: { index: number; reason: unknown }[] = [];
    let nextIndex = 0;
    let settled = 0;

    async function worker() {
      while (nextIndex < total) {
        const taskIndex = nextIndex++;
        try {
          const value = await tasks[taskIndex]();
          results[taskIndex] = value;
        } catch (err) {
          errors.push({ index: taskIndex, reason: err });
        }
        settled++;
        if (settled === total) {
          if (errors.length > 0) {
            errors.sort((a, b) => a.index - b.index);
            reject(errors[0].reason);
          } else {
            resolve(results);
          }
        }
      }
    }

    const workerCount = Math.min(concurrency, total);
    Promise.all(Array.from({ length: workerCount }, () => worker()));
  });
}

export { promisePool };
