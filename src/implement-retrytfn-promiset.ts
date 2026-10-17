// bloom-deps:

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  retryIf?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
  clock?: {
    now(): number;
    setTimeout(fn: () => void, ms: number): unknown;
    clearTimeout(id: unknown): void;
  };
}

export function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }

  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 100;
  const maxDelayMs = options?.maxDelayMs ?? 30000;
  const factor = options?.factor ?? 2;
  const jitter = options?.jitter ?? true;
  const retryIf = options?.retryIf;
  const onRetry = options?.onRetry;
  const signal = options?.signal;
  const clock = options?.clock ?? {
    now: () => Date.now(),
    setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
    clearTimeout: (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>),
  };

  if (maxAttempts < 1) {
    throw new RangeError('maxAttempts must be >= 1');
  }
  if (baseDelayMs < 0) {
    throw new RangeError('baseDelayMs must be >= 0');
  }
  if (factor < 1) {
    throw new RangeError('factor must be >= 1');
  }

  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      const reason = signal.reason ?? new DOMException('Aborted', 'AbortError');
      reject(reason);
      return;
    }

    let attempt = 0;
    let timeoutId: unknown = undefined;
    let done = false;

    function abort() {
      if (done) return;
      done = true;
      if (timeoutId !== undefined) {
        clock.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      const reason = signal!.reason ?? new DOMException('Aborted', 'AbortError');
      reject(reason);
    }

    if (signal) {
      signal.addEventListener('abort', abort, { once: true });
    }

    function cleanup() {
      if (signal) {
        signal.removeEventListener('abort', abort);
      }
    }

    function run() {
      if (done) return;

      attempt += 1;

      Promise.resolve()
        .then(() => fn())
        .then(
          (result) => {
            if (done) return;
            done = true;
            cleanup();
            resolve(result);
          },
          (err) => {
            if (done) return;

            const attemptsLeft = maxAttempts - attempt;

            if (attemptsLeft <= 0) {
              done = true;
              cleanup();
              reject(err);
              return;
            }

            if (retryIf && !retryIf(err, attempt)) {
              done = true;
              cleanup();
              reject(err);
              return;
            }

            // Delay for attempt k (1-indexed, k=attempt): baseDelayMs * factor^(k-1)
            const k = attempt;
            const computed = Math.min(baseDelayMs * Math.pow(factor, k - 1), maxDelayMs);
            const delayMs = jitter
              ? Math.floor(Math.random() * (computed + 1))
              : computed;

            if (onRetry) {
              onRetry(err, attempt, delayMs);
            }

            if (signal?.aborted) {
              abort();
              return;
            }

            timeoutId = clock.setTimeout(() => {
              timeoutId = undefined;
              run();
            }, delayMs);
          }
        );
    }

    run();
  });
}