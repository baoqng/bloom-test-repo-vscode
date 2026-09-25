// bloom-deps:

function parseRetryConfig(input: unknown): { maxAttempts: number; baseDelayMs: number; factor: number } | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    throw new TypeError('Invalid retry config');
  }

  const obj = input as Record<string, unknown>;

  const defaultMaxAttempts = 3;
  const defaultBaseDelayMs = 1000;
  const defaultFactor = 2.0;

  const minMaxAttempts = 1;
  const maxMaxAttempts = 20;
  const minBaseDelayMs = 10;
  const maxBaseDelayMs = 30000;
  const minFactor = 1.0;
  const maxFactor = 10.0;

  let maxAttempts: number;
  if ('maxAttempts' in obj && obj.maxAttempts !== undefined) {
    const raw = Number(obj.maxAttempts);
    if (isNaN(raw)) {
      maxAttempts = defaultMaxAttempts;
    } else {
      maxAttempts = Math.min(maxMaxAttempts, Math.max(minMaxAttempts, raw));
    }
  } else {
    maxAttempts = defaultMaxAttempts;
  }

  let baseDelayMs: number;
  if ('baseDelayMs' in obj && obj.baseDelayMs !== undefined) {
    const raw = Number(obj.baseDelayMs);
    if (isNaN(raw)) {
      baseDelayMs = defaultBaseDelayMs;
    } else {
      baseDelayMs = Math.min(maxBaseDelayMs, Math.max(minBaseDelayMs, raw));
    }
  } else {
    baseDelayMs = defaultBaseDelayMs;
  }

  let factor: number;
  if ('factor' in obj && obj.factor !== undefined) {
    const raw = Number(obj.factor);
    if (isNaN(raw)) {
      factor = defaultFactor;
    } else {
      factor = Math.min(maxFactor, Math.max(minFactor, raw));
    }
  } else {
    factor = defaultFactor;
  }

  return { maxAttempts, baseDelayMs, factor };
}

export { parseRetryConfig };