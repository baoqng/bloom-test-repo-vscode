// bloom-deps:

export class SlidingWindowRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly burstLimit: number;
  private readonly keyFn: (() => string) | undefined;
  private readonly clock: {
    now(): number;
    setTimeout(fn: () => void, ms: number): unknown;
    clearTimeout(id: unknown): void;
  };

  // Per-key state
  private readonly timestamps: Map<string, number[]> = new Map();
  private readonly stats: Map<string, { total: number; allowed: number; denied: number }> = new Map();
  private readonly waiters: Map<string, Array<() => void>> = new Map();

  constructor(options: {
    limit: number;
    windowMs: number;
    burstLimit?: number;
    keyFn?: () => string;
    clock?: {
      now(): number;
      setTimeout(fn: () => void, ms: number): unknown;
      clearTimeout(id: unknown): void;
    };
  }) {
    const { limit, windowMs, burstLimit = 0, keyFn, clock } = options;

    if (!Number.isFinite(limit)) {
      throw new TypeError('limit must be a finite number');
    }
    if (!Number.isFinite(windowMs)) {
      throw new TypeError('windowMs must be a finite number');
    }
    if (limit < 1) {
      throw new RangeError('limit must be >= 1');
    }
    if (windowMs < 1) {
      throw new RangeError('windowMs must be >= 1');
    }

    this.limit = limit;
    this.windowMs = windowMs;
    this.burstLimit = burstLimit;
    this.keyFn = keyFn;
    this.clock = clock ?? {
      now: () => Date.now(),
      setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
      clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
    };
  }

  private resolveKey(key?: string): string {
    if (key !== undefined) {
      return key;
    }
    if (this.keyFn !== undefined) {
      return this.keyFn();
    }
    return 'default';
  }

  private getTimestamps(key: string): number[] {
    let ts = this.timestamps.get(key);
    if (!ts) {
      ts = [];
      this.timestamps.set(key, ts);
    }
    return ts;
  }

  private getStatsInternal(key: string): { total: number; allowed: number; denied: number } {
    let s = this.stats.get(key);
    if (!s) {
      s = { total: 0, allowed: 0, denied: 0 };
      this.stats.set(key, s);
    }
    return s;
  }

  private getWaiters(key: string): Array<() => void> {
    let w = this.waiters.get(key);
    if (!w) {
      w = [];
      this.waiters.set(key, w);
    }
    return w;
  }

  private prune(timestamps: number[], now: number): void {
    const cutoff = now - this.windowMs;
    let i = 0;
    while (i < timestamps.length && timestamps[i] < cutoff) {
      i++;
    }
    if (i > 0) {
      timestamps.splice(0, i);
    }
  }

  private countInWindow(timestamps: number[], now: number): number {
    const cutoff = now - this.windowMs;
    let count = 0;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] >= cutoff) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  private drainWaiters(key: string): void {
    const waiters = this.waiters.get(key);
    if (!waiters || waiters.length === 0) return;

    const now = this.clock.now();
    const timestamps = this.getTimestamps(key);
    this.prune(timestamps, now);

    const maxAllowed = this.limit + this.burstLimit;

    while (waiters.length > 0) {
      const count = this.countInWindow(timestamps, now);
      if (count < maxAllowed) {
        const resolve = waiters.shift()!;
        timestamps.push(now);
        resolve();
      } else {
        // Schedule retry when oldest timestamp expires
        const cutoff = now - this.windowMs;
        let oldest = Infinity;
        for (const ts of timestamps) {
          if (ts >= cutoff && ts < oldest) {
            oldest = ts;
          }
        }
        const delay = oldest === Infinity ? this.windowMs : oldest + this.windowMs - now + 1;
        this.clock.setTimeout(() => this.drainWaiters(key), delay);
        break;
      }
    }
  }

  tryAcquire(key?: string): boolean {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getTimestamps(resolvedKey);
    const s = this.getStatsInternal(resolvedKey);

    this.prune(timestamps, now);

    const count = this.countInWindow(timestamps, now);
    const maxAllowed = this.limit + this.burstLimit;

    s.total++;
    if (count < maxAllowed) {
      timestamps.push(now);
      s.allowed++;
      return true;
    } else {
      s.denied++;
      return false;
    }
  }

  acquire(key?: string): Promise<void> {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getTimestamps(resolvedKey);

    this.prune(timestamps, now);

    const count = this.countInWindow(timestamps, now);
    const maxAllowed = this.limit + this.burstLimit;
    const s = this.getStatsInternal(resolvedKey);

    s.total++;

    if (count < maxAllowed) {
      timestamps.push(now);
      s.allowed++;
      return Promise.resolve();
    }

    s.denied++;

    return new Promise<void>((resolve) => {
      const waiters = this.getWaiters(resolvedKey);

      const wrappedResolve = () => {
        // Stats: undo denied, add allowed
        s.denied--;
        s.allowed++;
        resolve();
      };

      waiters.push(wrappedResolve);

      if (waiters.length === 1) {
        // Schedule first drain
        const cutoff = now - this.windowMs;
        let oldest = Infinity;
        for (const ts of timestamps) {
          if (ts >= cutoff && ts < oldest) {
            oldest = ts;
          }
        }
        const delay = oldest === Infinity ? this.windowMs : oldest + this.windowMs - now + 1;
        this.clock.setTimeout(() => this.drainWaiters(resolvedKey), delay);
      }
    });
  }

  remaining(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getTimestamps(resolvedKey);
    this.prune(timestamps, now);
    const count = this.countInWindow(timestamps, now);
    const maxAllowed = this.limit + this.burstLimit;
    return Math.max(0, maxAllowed - count);
  }

  resetTime(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getTimestamps(resolvedKey);
    this.prune(timestamps, now);

    if (timestamps.length === 0) {
      return now;
    }

    // The oldest tracked request exits the window at oldest + windowMs
    return timestamps[0] + this.windowMs;
  }

  reset(key?: string): void {
    if (key !== undefined) {
      const resolvedKey = this.resolveKey(key);
      this.timestamps.set(resolvedKey, []);
      this.drainWaiters(resolvedKey);
    } else if (this.keyFn !== undefined && key === undefined) {
      // reset all
      for (const k of this.timestamps.keys()) {
        this.timestamps.set(k, []);
      }
      for (const k of this.waiters.keys()) {
        this.drainWaiters(k);
      }
    } else {
      // No keyFn, no key arg — reset all
      for (const k of this.timestamps.keys()) {
        this.timestamps.set(k, []);
      }
      for (const k of this.waiters.keys()) {
        this.drainWaiters(k);
      }
    }
  }

  getStats(key?: string): { total: number; allowed: number; denied: number } {
    const resolvedKey = this.resolveKey(key);
    const s = this.stats.get(resolvedKey);
    if (!s) {
      return { total: 0, allowed: 0, denied: 0 };
    }
    return { total: s.total, allowed: s.allowed, denied: s.denied };
  }
}