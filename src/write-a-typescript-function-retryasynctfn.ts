// bloom-deps:

export function retryAsync<T>(
  fn: (attempt: number) => Promise<T>,
  maxAttempts: number,
  shouldRetry: (err: unknown) => boolean
): Promise<T> {
  // Validate fn is a function
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }

  // Validate shouldRetry is a function
  if (typeof shouldRetry !== 'function') {
    throw new TypeError('shouldRetry must be a function');
  }

  // Validate maxAttempts is a positive safe integer
  if (
    !Number.isInteger(maxAttempts) ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts <= 0
  ) {
    throw new RangeError('maxAttempts must be a positive safe integer');
  }

  let lastError: unknown;
  let lastErrorWasFromShouldRetry = false;

  return (async () => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        lastErrorWasFromShouldRetry = false;

        // Check if we should retry
        let shouldContinue = false;
        try {
          shouldContinue = shouldRetry(err);
        } catch (shouldRetryErr) {
          // shouldRetry threw - reject with the thrown value
          lastError = shouldRetryErr;
          lastErrorWasFromShouldRetry = true;
          break;
        }

        // If shouldRetry returned false or we've exhausted attempts, stop retrying
        if (!shouldContinue || attempt === maxAttempts) {
          break;
        }
      }
    }

    // Reject with appropriate error wrapping
    if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error(
        `non-error rejection: ${String(lastError)}`,
        { cause: lastError }
      );
    }
  })();
}