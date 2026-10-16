// bloom-deps:

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  // Synchronous validation before any async work
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }

  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new TypeError('maxAttempts must be a positive integer');
  }

  if (
    !Number.isFinite(options.initialDelayMs) ||
    options.initialDelayMs <= 0
  ) {
    throw new TypeError('initialDelayMs must be a positive finite number');
  }

  if (options.maxDelayMs < options.initialDelayMs) {
    throw new TypeError('maxDelayMs must be >= initialDelayMs');
  }

  if (options.backoffFactor < 1) {
    throw new TypeError('backoffFactor must be >= 1');
  }

  // Now proceed with async execution
  return (async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // If shouldRetry is provided and returns false, rethrow immediately
        if (
          options.shouldRetry !== undefined &&
          !options.shouldRetry(error)
        ) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === options.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const exponentialDelay =
          options.initialDelayMs *
          Math.pow(options.backoffFactor, attempt - 1);

        // Add jitter: random value in [0, initialDelayMs * 0.1]
        const jitter = Math.random() * options.initialDelayMs * 0.1;

        // Compute total delay, capped at maxDelayMs
        const totalDelay = Math.min(
          exponentialDelay + jitter,
          options.maxDelayMs
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }

    // Should not reach here, but throw lastError as fallback
    throw lastError;
  })();
}