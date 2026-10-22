// bloom-deps:

function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  if (limit < 1) {
    throw new RangeError('limit must be at least 1');
  }

  if (tasks.length === 0) {
    return Promise.resolve([]);
  }

  const results = new Array<T>(tasks.length);
  let nextIndex = 0;
  let firstError: { value: unknown } | undefined;

  async function worker(): Promise<void> {
    while (!firstError && nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (error) {
        firstError ??= { value: error };
      }
    }
  }

  const workerCount = Math.min(limit, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  return Promise.all(workers).then(() => {
    if (firstError) {
      throw firstError.value;
    }
    return results;
  });
}

export { runWithConcurrency };