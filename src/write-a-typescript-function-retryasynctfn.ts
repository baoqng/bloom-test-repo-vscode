function wrapError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }
  const wrapped = new Error(`non-error rejection: ${String(err)}`);
  (wrapped as any).cause = err;
  return wrapped;
}

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
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new RangeError('maxAttempts must be a positive safe integer');
  }

  return (async () => {
    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastErr = err;

        if (attempt === maxAttempts) {
          break;
        }

        let retryResult: boolean;
        try {
          retryResult = shouldRetry(err);
        } catch (shouldRetryErr) {
          throw wrapError(shouldRetryErr);
        }

        if (!retryResult) {
          break;
        }
      }
    }

    throw wrapError(lastErr);
  })();
}