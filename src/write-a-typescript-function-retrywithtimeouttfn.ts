function retryWithTimeout<T>(
  fn: (signal: AbortSignal, attempt: number) => Promise<T>,
  attempts: number,
  timeoutMs: number
): Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }
  if (
    !Number.isSafeInteger(attempts) ||
    attempts <= 0
  ) {
    throw new RangeError('attempts must be a positive safe integer');
  }
  if (
    typeof timeoutMs !== 'number' ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new RangeError('timeoutMs must be a positive finite number');
  }

  return new Promise<T>((resolve, reject) => {
    let currentAttempt = 0;

    function runAttempt(): void {
      currentAttempt++;
      const attemptNumber = currentAttempt;
      const controller = new AbortController();
      const signal = controller.signal;

      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      function onSuccess(value: T): void {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }

      function onFailure(reason: unknown): void {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (attemptNumber < attempts) {
          runAttempt();
        } else {
          if (reason instanceof Error) {
            reject(reason);
          } else {
            const err = new Error(`non-error rejection: ${String(reason)}`);
            (err as any).cause = reason;
            reject(err);
          }
        }
      }

      timer = setTimeout(() => {
        if (settled) return;
        const domException = new DOMException('TimeoutError', 'TimeoutError');
        controller.abort(domException);
        onFailure(domException);
      }, timeoutMs);

      let resultPromise: Promise<T>;
      try {
        resultPromise = fn(signal, attemptNumber);
      } catch (syncErr) {
        clearTimeout(timer);
        settled = true;
        if (attemptNumber < attempts) {
          runAttempt();
        } else {
          if (syncErr instanceof Error) {
            reject(syncErr);
          } else {
            const err = new Error(`non-error rejection: ${String(syncErr)}`);
            (err as any).cause = syncErr;
            reject(err);
          }
        }
        return;
      }

      Promise.resolve(resultPromise).then(
        (value) => {
          onSuccess(value);
        },
        (reason) => {
          onFailure(reason);
        }
      );
    }

    runAttempt();
  });
}

export { retryWithTimeout };