// bloom-deps:

export interface Semaphore {
  acquire(): Promise<void>;
  release(): void;
}

export function createSemaphore(permits: number): Semaphore {
  if (
    typeof permits !== 'number' ||
    !Number.isInteger(permits) ||
    permits <= 0
  ) {
    throw new RangeError(
      `permits must be a positive integer, got ${permits}`
    );
  }

  const initialPermits = permits;
  let available = permits;
  const waiters: Array<() => void> = [];

  return {
    acquire(): Promise<void> {
      if (available > 0) {
        available--;
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        waiters.push(resolve);
      });
    },

    release(): void {
      if (waiters.length > 0) {
        const next = waiters.shift()!;
        next();
      } else {
        if (available < initialPermits) {
          available++;
        }
        // no-op if available already equals initialPermits
      }
    },
  };
}