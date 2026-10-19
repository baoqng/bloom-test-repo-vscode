// bloom-deps:

function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    return Promise.reject(new RangeError('limit must be a positive integer'));
  }

  if (tasks.length === 0) {
    return Promise.resolve([]);
  }

  const results = new Array<T>(tasks.length);
  let nextIndex = 0;
  let firstError: { value: unknown } | undefined;

  function worker(): Promise<void> {
    async function run(): Promise<void> {
      while (!firstError && nextIndex < tasks.length) {
        const index = nextIndex++;
        try {
          results[index] = await tasks[index]();
        } catch (error) {
          firstError ??= { value: error };
        }
      }
    }
    return run();
  }

  const workerCount = Math.min(limit, tasks.length);
  const workers = Array.from({ length: workerCount }, worker);

  return Promise.all(workers).then(() => {
    if (firstError) {
      throw firstError.value;
    }
    return results;
  });
}

export { runWithConcurrency };
