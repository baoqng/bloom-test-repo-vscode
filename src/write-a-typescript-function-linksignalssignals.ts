// bloom-deps:

function linkSignals(
  signals: AbortSignal[],
  timeoutMs?: number
): { signal: AbortSignal; dispose(): void } {
  // Validate signals
  if (!Array.isArray(signals) || !signals.every((s) => s instanceof AbortSignal)) {
    throw new TypeError('signals must be an array of AbortSignal instances');
  }

  // Validate timeoutMs
  if (timeoutMs !== undefined) {
    if (typeof timeoutMs !== 'number' || !isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new RangeError('timeoutMs must be a positive finite number');
    }
  }

  const controller = new AbortController();
  let disposed = false;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const listeners: Array<{ signal: AbortSignal; handler: () => void }> = [];

  function cleanup(): void {
    if (disposed) return;
    disposed = true;
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    for (const { signal, handler } of listeners) {
      signal.removeEventListener('abort', handler);
    }
    listeners.length = 0;
  }

  function abortWith(reason: unknown): void {
    if (controller.signal.aborted) return;
    cleanup();
    controller.abort(reason);
  }

  // Check if any input is already aborted
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      // Return immediately with already-aborted signal, no timer, no listeners
      return {
        signal: controller.signal,
        dispose(): void {
          // No-op: nothing to clean up
        },
      };
    }
  }

  // Set up abort listeners for each input signal
  for (const signal of signals) {
    const handler = (): void => {
      abortWith(signal.reason);
    };
    listeners.push({ signal, handler });
    signal.addEventListener('abort', handler);
  }

  // Set up timeout if provided
  if (timeoutMs !== undefined) {
    timerId = setTimeout(() => {
      const reason = new DOMException('The operation timed out.', 'TimeoutError');
      abortWith(reason);
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    dispose(): void {
      cleanup();
    },
  };
}

export { linkSignals };