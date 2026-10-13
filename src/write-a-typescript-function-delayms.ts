// bloom-deps:

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  // Validate ms is a non-negative finite number
  if (typeof ms !== 'number' || ms < 0 || !isFinite(ms)) {
    throw new RangeError('ms must be a non-negative finite number');
  }

  // If signal is already aborted, reject immediately with signal.reason
  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }

  return new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let abortListenerAttached = false;

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal!.reason);
    };

    // Set up abort listener with { once: true } so it auto-removes
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
      abortListenerAttached = true;
    }

    // Start the timer
    timeoutId = setTimeout(() => {
      // Timer fired; remove the abort listener if it was attached
      if (abortListenerAttached && signal) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, ms);
  });
}