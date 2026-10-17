// bloom-deps:

type Task<T, R> = (item: T, signal: AbortSignal) => Promise<R>;

type Outcome<R> = { index: number; result: R } | { index: number; error: unknown };

export async function asyncPool<T, R>(
  items: T[],
  worker: Task<T, R>,
  options: {
    concurrency: number;
    signal?: AbortSignal;
    stopOnError?: boolean;
  }
): Promise<Array<Outcome<R>>> {
  const { concurrency, signal, stopOnError = false } = options;

  if (concurrency < 1) {
    throw new RangeError('concurrency must be at least 1');
  }

  if (items.length === 0) {
    return [];
  }

  const results = new Array<Outcome<R>>(items.length);
  let nextIndex = 0;
  let firstError: { value: unknown } | undefined;
  let stopped = false;

  // Create a never-aborting fallback signal if none provided
  const neverAbortController = new AbortController();
  const effectiveSignal = signal ?? neverAbortController.signal;

  async function runWorker(): Promise<void> {
    while (true) {
      if (stopped) {
        break;
      }

      const index = nextIndex++;
      if (index >= items.length) {
        break;
      }

      // Check if signal is already aborted before starting this task
      if (effectiveSignal.aborted) {
        const abortError = effectiveSignal.reason ?? new Error('aborted');
        results[index] = { index, error: abortError };

        // Fill remaining tasks that this worker would have taken
        // But we only mark the current slot; the loop will continue and other
        // pending slots will be handled by other workers or this one continuing
        continue;
      }

      try {
        const resultValue = await Promise.resolve(worker(items[index], effectiveSignal));
        results[index] = { index, result: resultValue };
      } catch (err) {
        results[index] = { index, error: err };

        if (stopOnError && !firstError) {
          firstError = { value: err };
          stopped = true;
          break;
        }
      }
    }
  }

  // Handle aborted signal: mark remaining pending tasks as aborted
  // We need to handle the case where signal aborts while tasks are pending (not yet started)
  // We do this by checking in the loop above. But we also need to handle
  // tasks that haven't been picked up yet when abort fires mid-execution.

  const workerCount = Math.min(concurrency, items.length);
  const workerPromises = Array.from({ length: workerCount }, () => runWorker());

  if (stopOnError) {
    // Race: either all workers finish, or we get a stop signal
    await Promise.all(workerPromises);

    if (firstError) {
      throw firstError.value;
    }
  } else {
    await Promise.all(workerPromises);

    // Fill any slots that were skipped due to early stop (shouldn't happen in non-stopOnError mode)
    // But handle the case where signal aborted some tasks that weren't processed
    // due to workers finishing early
    for (let i = 0; i < items.length; i++) {
      if (results[i] === undefined) {
        const abortError = effectiveSignal.aborted
          ? (effectiveSignal.reason ?? new Error('aborted'))
          : new Error('task not executed');
        results[i] = { index: i, error: abortError };
      }
    }
  }

  // If stopOnError was true but no error, fill any unprocessed slots
  if (stopOnError) {
    for (let i = 0; i < items.length; i++) {
      if (results[i] === undefined) {
        const abortError = effectiveSignal.aborted
          ? (effectiveSignal.reason ?? new Error('aborted'))
          : new Error('task not executed');
        results[i] = { index: i, error: abortError };
      }
    }
  }

  // Clean up the never-abort controller if we created it
  if (!signal) {
    neverAbortController.abort();
  }

  return results;
}