// bloom-deps:

export function createDebounce(
  fn: (...args: unknown[]) => void,
  waitMs: number
): { debounced: (...args: unknown[]) => void; cancel: () => void; flush: () => void } {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }
  if (!Number.isInteger(waitMs) || waitMs <= 0) {
    throw new TypeError('waitMs must be a positive integer');
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: unknown[] | undefined;

  const cancel = (): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
      pendingArgs = undefined;
    }
  };

  const flush = (): void => {
    if (timerId !== undefined) {
      const args = pendingArgs!;
      cancel();
      fn(...args);
    }
  };

  const debounced = (...args: unknown[]): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    pendingArgs = args;
    timerId = setTimeout(() => {
      const argsToCall = pendingArgs!;
      timerId = undefined;
      pendingArgs = undefined;
      fn(...argsToCall);
    }, waitMs);
  };

  return { debounced, cancel, flush };
}