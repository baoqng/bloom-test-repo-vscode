// bloom-deps:

function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, baseDelayMs: number): Promise<T> {
  if (maxRetries < 1) {
    throw new RangeError('maxRetries must be at least 1');
  }
  if (baseDelayMs < 0) {
    throw new RangeError('baseDelayMs must be non-negative');
  }

  const attempt = (retriesLeft: number, currentDelay: number, resolve: (value: T) => void, reject: (reason?: unknown) => void): void => {
    fn().then(resolve).catch((error: unknown) => {
      if (retriesLeft <= 1) {
        reject(error);
        return;
      }
      setTimeout(() => {
        attempt(retriesLeft - 1, currentDelay * 2, resolve, reject);
      }, currentDelay);
    });
  };

  return new Promise<T>((resolve, reject) => {
    attempt(maxRetries, baseDelayMs, resolve, reject);
  });
}

export { retryWithBackoff };