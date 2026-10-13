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
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts <= 0
  ) {
    throw new RangeError('maxAttempts must be a positive safe integer');
  }

  let lastError: unknown = undefined;

  return (async () => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;

        // Check if we should retry
        let shouldContinue = false;
        try {
          shouldContinue = shouldRetry(err);
        } catch (shouldRetryErr) {
          // shouldRetry itself threw
          if (shouldRetryErr instanceof Error) {
            throw shouldRetryErr;
          } else {
            throw new Error(
              `non-error rejection: ${String(shouldRetryErr)}`,
              { cause: shouldRetryErr }
            );
          }
        }

        // If shouldRetry returned false or we've exhausted attempts, reject
        if (!shouldContinue || attempt === maxAttempts) {
          if (lastError instanceof Error) {
            throw lastError;
          } else {
            throw new Error(
              `non-error rejection: ${String(lastError)}`,
              { cause: lastError }
            );
          }
        }

        // Continue to next attempt (no delay)
      }
    }

    // Unreachable, but satisfy type checker
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