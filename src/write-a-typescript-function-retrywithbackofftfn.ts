// bloom-deps:

function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; initialDelayMs: number; maxDelayMs: number; factor: number }
): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, factor } = options;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError('maxAttempts must be a positive integer');
  }
  if (!Number.isFinite(initialDelayMs) || initialDelayMs <= 0) {
    throw new RangeError('initialDelayMs must be a positive finite number');
  }
  if (maxDelayMs < initialDelayMs) {
    throw new RangeError('maxDelayMs must not be less than initialDelayMs');
  }
  if (factor < 1) {
    throw new RangeError('factor must be at least 1');
  }

  const delay = (ms: number): Promise<void> =>
    new Promise<void>(resolve => setTimeout(resolve, ms));

  const run = async (): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          const delayMs = Math.min(initialDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
          await delay(delayMs);
        }
      }
    }
    throw lastError;
  };

  return run();
}

export { retryWithBackoff };