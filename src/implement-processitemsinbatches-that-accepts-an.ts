export function processItemsInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  if (batchSize < 1) {
    return Promise.reject(new RangeError(`batchSize must be at least 1, got ${batchSize}`));
  }

  async function run(): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    return results;
  }

  return run();
}