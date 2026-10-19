// bloom-deps:

function retryWithBackoff(
  fn: () => Promise<unknown>,
  maxAttempts: number,
  baseMs: number
): Promise<unknown> {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError(
      `maxAttempts must be an integer >= 1, got ${maxAttempts}`
    );
  }
  if (baseMs < 0) {
    throw new RangeError(`baseMs must be non-negative, got ${baseMs}`);
  }

  return (async () => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delayMs = baseMs * Math.pow(2, attempt - 2);
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
      try {
        return await fn();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  })();
}

export { retryWithBackoff };