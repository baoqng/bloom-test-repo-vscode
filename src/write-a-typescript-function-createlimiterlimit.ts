// bloom-deps:

export function createLimiter(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
  if (
    typeof limit !== 'number' ||
    !Number.isSafeInteger(limit) ||
    limit <= 0
  ) {
    throw new RangeError('limit must be a positive safe integer');
  }

  let running = 0;
  const queue: Array<() => void> = [];

  function next(): void {
    if (queue.length > 0 && running < limit) {
      const start = queue.shift()!;
      start();
    }
  }

  return function run<T>(task: () => Promise<T>): Promise<T> {
    if (typeof task !== 'function') {
      throw new TypeError('task must be a function');
    }

    return new Promise<T>((resolve, reject) => {
      function startTask(): void {
        running++;

        let resultPromise: Promise<T>;
        try {
          resultPromise = task();
        } catch (err) {
          running--;
          reject(err);
          next();
          return;
        }

        Promise.resolve(resultPromise).then(
          (value) => {
            running--;
            resolve(value);
            next();
          },
          (err) => {
            running--;
            reject(err);
            next();
          }
        );
      }

      if (running < limit) {
        startTask();
      } else {
        queue.push(startTask);
      }
    });
  };
}