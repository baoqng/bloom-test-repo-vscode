// bloom-deps:

async function retry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }
  if (typeof retries !== 'number' || !Number.isInteger(retries)) {
    throw new TypeError('retries must be an integer');
  }
  if (retries < 1) {
    throw new Error('retries must be at least 1');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

export { retry };