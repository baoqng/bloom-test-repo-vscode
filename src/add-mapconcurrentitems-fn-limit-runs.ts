// bloom-deps:

export function mapConcurrent<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let rejected = false;
  let firstError: unknown;

  const worker = async (): Promise<void> => {
    while (!rejected && nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await fn(items[index]);
      } catch (error) {
        if (!rejected) {
          rejected = true;
          firstError = error;
        }
      }
    }
  };

  const workerCount = Math.min(limit, items.length);

  if (workerCount <= 0) {
    return Promise.resolve([]);
  }

  const workers = Array.from({ length: workerCount }, () => worker());

  return Promise.all(workers).then(() => {
    if (rejected) {
      throw firstError;
    }
    return results;
  });
}