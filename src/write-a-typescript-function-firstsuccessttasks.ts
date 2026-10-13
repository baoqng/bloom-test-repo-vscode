// bloom-deps:

function firstSuccess<T>(tasks: Array<() => Promise<T>>): Promise<T> {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks must be an array');
  }
  for (let i = 0; i < tasks.length; i++) {
    if (typeof tasks[i] !== 'function') {
      throw new TypeError(`tasks[${i}] must be a function`);
    }
  }

  if (tasks.length === 0) {
    return Promise.reject(new RangeError('tasks must not be empty'));
  }

  return new Promise<T>((resolve, reject) => {
    const errors: (Error | unknown)[] = new Array(tasks.length);
    let rejectionCount = 0;
    let settled = false;

    function normalizeError(value: unknown): Error {
      if (value instanceof Error) {
        return value;
      }
      const err = new Error(`non-error value: ${String(value)}`);
      (err as any).cause = value;
      return err;
    }

    for (let i = 0; i < tasks.length; i++) {
      const index = i;
      let p: Promise<T>;
      try {
        p = tasks[index]();
      } catch (syncError) {
        errors[index] = normalizeError(syncError);
        rejectionCount++;
        if (rejectionCount === tasks.length && !settled) {
          settled = true;
          reject(new AggregateError(errors as Error[], 'all tasks failed'));
        }
        continue;
      }

      Promise.resolve(p).then(
        (value) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        },
        (reason) => {
          errors[index] = normalizeError(reason);
          rejectionCount++;
          if (rejectionCount === tasks.length && !settled) {
            settled = true;
            reject(new AggregateError(errors as Error[], 'all tasks failed'));
          }
        }
      );
    }
  });
}

export { firstSuccess };