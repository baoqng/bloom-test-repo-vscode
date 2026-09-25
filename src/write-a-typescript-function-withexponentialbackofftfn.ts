// bloom-deps:

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelayMs: number; maxDelayMs: number }
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = options;

  if (
    typeof maxRetries !== 'number' ||
    !Number.isInteger(maxRetries) ||
    maxRetries < 0
  ) {
    throw new TypeError(
      `maxRetries must be a non-negative integer, got: ${maxRetries}`
    );
  }

  if (
    typeof baseDelayMs !== 'number' ||
    !Number.isInteger(baseDelayMs) ||
    baseDelayMs <= 0
  ) {
    throw new TypeError(
      `baseDelayMs must be a positive integer, got: ${baseDelayMs}`
    );
  }

  if (typeof maxDelayMs !== 'number' || maxDelayMs < baseDelayMs) {
    throw new TypeError(
      `maxDelayMs must be >= baseDelayMs (${baseDelayMs}), got: ${maxDelayMs}`
    );
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export { withExponentialBackoff };