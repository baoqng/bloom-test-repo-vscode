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

  // Per-key timestamp lists (sliding window)
  private readonly windows: Map<string, number[]> = new Map();

  // Per-key lifetime stats
  private readonly statsMap: Map<string, { total: number; allowed: number; denied: number }> = new Map();

  // Per-key FIFO waiter queues
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
      return 'default';
    }
    return 'default';
  }

  private getWindow(key: string): number[] {
    let w = this.windows.get(key);
    if (!w) {
      w = [];
      this.windows.set(key, w);
    }
    return w;
  }

  private getStatsInternal(resolvedKey: string): { total: number; allowed: number; denied: number } {
    let s = this.statsMap.get(resolvedKey);
    if (!s) {
      s = { total: 0, allowed: 0, denied: 0 };
      this.statsMap.set(resolvedKey, s);
    }
    return s;
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

  private effectiveCap(): number {
    return this.limit + this.burstLimit;
  }

  tryAcquire(key?: string): boolean {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getWindow(resolvedKey);
    const s = this.getStatsInternal(resolvedKey);

    this.prune(timestamps, now);

    s.total++;

    if (timestamps.length < this.effectiveCap()) {
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

    const attempt = (): Promise<void> => {
      const now = this.clock.now();
      const timestamps = this.getWindow(resolvedKey);
      const s = this.getStatsInternal(resolvedKey);

      this.prune(timestamps, now);

      if (timestamps.length < this.effectiveCap()) {
        timestamps.push(now);
        s.total++;
        s.allowed++;
        return Promise.resolve();
      }

      // Need to wait — compute delay until oldest timestamp exits window
      const oldestTs = timestamps[0];
      const delay = oldestTs + this.windowMs - now;

      return new Promise<void>((resolve) => {
        let waiters = this.waiters.get(resolvedKey);
        if (!waiters) {
          waiters = [];
          this.waiters.set(resolvedKey, waiters);
        }

        const waiter = () => resolve();
        waiters.push(waiter);

        this.clock.setTimeout(() => {
          const wList = this.waiters.get(resolvedKey);
          if (!wList) return;
          const idx = wList.indexOf(waiter);
          if (idx === -1) return; // already resolved (e.g. by reset)
          wList.splice(idx, 1);
          if (wList.length === 0) {
            this.waiters.delete(resolvedKey);
          }
          resolve();
        }, Math.max(0, delay));
      }).then(() => attempt());
    };

    return attempt();
  }

  remaining(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getWindow(resolvedKey);
    this.prune(timestamps, now);
    return Math.max(0, this.effectiveCap() - timestamps.length);
  }

  resetTime(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const now = this.clock.now();
    const timestamps = this.getWindow(resolvedKey);
    this.prune(timestamps, now);
    if (timestamps.length === 0) {
      return now;
    }
    return timestamps[0] + this.windowMs;
  }

  reset(key?: string): void {
    if (key === undefined && this.keyFn === undefined) {
      // Clear all keys
      this.windows.clear();
      // Wake all waiters for all keys
      for (const [k, wList] of this.waiters.entries()) {
        const list = [...wList];
        wList.length = 0;
        this.waiters.delete(k);
        for (const w of list) {
          w();
        }
      }
    } else {
      const resolvedKey = this.resolveKey(key);
      this.windows.delete(resolvedKey);
      const wList = this.waiters.get(resolvedKey);
      if (wList) {
        const list = [...wList];
        wList.length = 0;
        this.waiters.delete(resolvedKey);
        for (const w of list) {
          w();
        }
      }
    }
  }

  getStats(key?: string): { total: number; allowed: number; denied: number } {
    const resolvedKey = this.resolveKey(key);
    const s = this.statsMap.get(resolvedKey);
    if (!s) {
      return { total: 0, allowed: 0, denied: 0 };
    }
    return { ...s };
  }
}