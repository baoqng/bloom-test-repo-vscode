// bloom-deps:

export function retryAsync<T>(
  fn: (attempt: number) => Promise<T>,
  maxAttempts: number,
  shouldRetry: (err: unknown) => boolean
): Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }
  if (typeof shouldRetry !== 'function') {
    throw new TypeError('shouldRetry must be a function');
  }
  if (
    typeof maxAttempts !== 'number' ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new RangeError('maxAttempts must be a positive safe integer');
  }

  function wrapError(err: unknown): Error {
    if (err instanceof Error) {
      return err;
    }
    const wrapped = new Error(`non-error rejection: ${String(err)}`);
    (wrapped as any).cause = err;
    return wrapped;
  }

  return (async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn(attempt);
        return result;
      } catch (err) {
        lastError = err;

        if (attempt === maxAttempts) {
          break;
        }

        let retryDecision: boolean;
        try {
          retryDecision = shouldRetry(err);
        } catch (shouldRetryErr) {
          throw wrapError(shouldRetryErr);
        }

        if (!retryDecision) {
          break;
        }
      }
    }

    throw wrapError(lastError);
  })();
}