// bloom-deps:

export function asyncPool<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  // Validate tasks parameter
  if (!Array.isArray(tasks)) {
    return Promise.reject(new TypeError('tasks must be an array'));
  }

  // Validate concurrency parameter
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    return Promise.reject(new RangeError('concurrency must be a positive integer'));
  }

  // Handle empty task list
  if (tasks.length === 0) {
    return Promise.resolve([]);
  }

  const results: T[] = new Array(tasks.length);
  let nextTaskIndex = 0;
  const errors: { index: number; value: unknown }[] = [];
  const activePromises: Promise<void>[] = [];

  async function worker(): Promise<void> {
    while (nextTaskIndex < tasks.length) {
      const taskIndex = nextTaskIndex++;
      const task = tasks[taskIndex];

      try {
        results[taskIndex] = await task();
      } catch (error) {
        errors.push({ index: taskIndex, value: error });
      }
    }
  }

  // Start initial workers
  const workerCount = Math.min(concurrency, tasks.length);
  for (let i = 0; i < workerCount; i++) {
    activePromises.push(worker());
  }

  // Wait for all workers to complete, then resolve or reject
  return Promise.all(activePromises).then(() => {
    if (errors.length > 0) {
      // Reject with the error from the task with the lowest start index
      errors.sort((a, b) => a.index - b.index);
      return Promise.reject(errors[0].value);
    }
    return results;
  });
}
