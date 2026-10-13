// bloom-deps:

export function withDeadline<T>(task: () => Promise<T>, timeoutMs: number): Promise<T> {
  if (typeof task !== 'function') {
    throw new TypeError('task must be a function');
  }
  if (typeof timeoutMs !== 'number' || !isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive finite number');
  }

  let taskPromise: Promise<T>;
  try {
    taskPromise = task();
  } catch (syncError) {
    return Promise.reject(syncError);
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const deadlineError = new Error(`deadline of ${timeoutMs}ms exceeded`);
      deadlineError.name = 'DeadlineError';
      reject(deadlineError);
    }, timeoutMs);

    taskPromise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(reason);
      }
    );
  });
}