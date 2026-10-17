export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  // Validate maxAttempts
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts <= 0) {
    throw new TypeError("maxAttempts must be a positive integer");
  }

  // Validate initialDelayMs
  if (
    typeof options.initialDelayMs !== "number" ||
    !Number.isFinite(options.initialDelayMs) ||
    options.initialDelayMs <= 0
  ) {
    throw new RangeError("initialDelayMs must be a positive finite number");
  }

  // Validate maxDelayMs
  if (options.maxDelayMs < options.initialDelayMs) {
    throw new RangeError("maxDelayMs must be greater than or equal to initialDelayMs");
  }

  // Validate factor
  if (options.factor < 1) {
    throw new RangeError("factor must be greater than or equal to 1");
  }

  return _retryWithBackoffAsync(fn, options);
}

async function _retryWithBackoffAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this was the last attempt, throw the error as-is
      if (attempt === options.maxAttempts) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delayMs = Math.min(
        options.initialDelayMs * Math.pow(options.factor, attempt - 1),
        options.maxDelayMs
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for exhaustiveness
  throw lastError;
}