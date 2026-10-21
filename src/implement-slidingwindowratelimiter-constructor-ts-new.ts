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

  private readonly buckets: Map<string, number[]> = new Map();
  private readonly _stats: Map<string, { total: number; allowed: number; denied: number }> = new Map();
  private readonly waiters: Map<string, Array<{ resolve: () => void }>> = new Map();

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
      clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof globalThis.setTimeout>),
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

  private getBucket(key: string): number[] {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = [];
      this.buckets.set(key, bucket);
    }
    return bucket;
  }

  private _getStats(resolvedKey: string): { total: number; allowed: number; denied: number } {
    let s = this._stats.get(resolvedKey);
    if (!s) {
      s = { total: 0, allowed: 0, denied: 0 };
      this._stats.set(resolvedKey, s);
    }
    return s;
  }

  private prune(bucket: number[], now: number): void {
    const cutoff = now - this.windowMs;
    let i = 0;
    while (i < bucket.length && bucket[i] < cutoff) {
      i++;
    }
    if (i > 0) {
      bucket.splice(0, i);
    }
  }

  private effectiveCap(): number {
    return this.limit + this.burstLimit;
  }

  tryAcquire(key?: string): boolean {
    const resolvedKey = this.resolveKey(key);
    const bucket = this.getBucket(resolvedKey);
    const s = this._getStats(resolvedKey);
    const now = this.clock.now();

    this.prune(bucket, now);

    s.total++;

    if (bucket.length < this.effectiveCap()) {
      bucket.push(now);
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
      const bucket = this.getBucket(resolvedKey);
      const s = this._getStats(resolvedKey);
      const now = this.clock.now();

      this.prune(bucket, now);

      if (bucket.length < this.effectiveCap()) {
        bucket.push(now);
        s.total++;
        s.allowed++;
        return Promise.resolve();
      }

      // Must wait — enqueue as a waiter
      return new Promise<void>((resolve) => {
        let waiters = this.waiters.get(resolvedKey);
        if (!waiters) {
          waiters = [];
          this.waiters.set(resolvedKey, waiters);
        }
        waiters.push({ resolve });

        // Schedule a retry when the oldest entry exits the window
        const oldest = bucket[0];
        const delay = oldest - (now - this.windowMs);
        const safeDelay = Math.max(delay, 0);

        this.clock.setTimeout(() => {
          this.drainWaiters(resolvedKey);
        }, safeDelay);
      });
    };

    return attempt();
  }

  private drainWaiters(resolvedKey: string): void {
    const waiters = this.waiters.get(resolvedKey);
    if (!waiters || waiters.length === 0) return;

    const now = this.clock.now();
    const bucket = this.getBucket(resolvedKey);
    this.prune(bucket, now);

    while (waiters.length > 0 && bucket.length < this.effectiveCap()) {
      const waiter = waiters.shift()!;
      const s = this._getStats(resolvedKey);
      bucket.push(this.clock.now());
      s.total++;
      s.allowed++;
      waiter.resolve();
    }

    // If there are still waiters, schedule next drain
    if (waiters.length > 0) {
      const currentNow = this.clock.now();
      this.prune(bucket, currentNow);
      if (bucket.length > 0) {
        const oldest = bucket[0];
        const delay = Math.max(oldest - (currentNow - this.windowMs), 0);
        this.clock.setTimeout(() => {
          this.drainWaiters(resolvedKey);
        }, delay);
      }
    }
  }

  remaining(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const bucket = this.getBucket(resolvedKey);
    const now = this.clock.now();
    this.prune(bucket, now);
    return Math.max(0, this.effectiveCap() - bucket.length);
  }

  resetTime(key?: string): number {
    const resolvedKey = this.resolveKey(key);
    const bucket = this.getBucket(resolvedKey);
    const now = this.clock.now();
    this.prune(bucket, now);
    if (bucket.length === 0) {
      return now;
    }
    return bucket[0] + this.windowMs;
  }

  reset(key?: string): void {
    if (key === undefined && this.keyFn === undefined) {
      // Clear all keys
      this.buckets.clear();
      // Drain all waiters for all keys
      for (const [k] of this.waiters) {
        this.drainWaiters(k);
      }
      return;
    }

    if (key === undefined) {
      // Clear all keys
      const allKeys = new Set([...this.buckets.keys(), ...this.waiters.keys()]);
      this.buckets.clear();
      for (const k of allKeys) {
        this.drainWaiters(k);
      }
      return;
    }

    const resolvedKey = this.resolveKey(key);
    this.buckets.set(resolvedKey, []);
    this.drainWaiters(resolvedKey);
  }

  getStats(key?: string): { total: number; allowed: number; denied: number } {
    const resolvedKey = this.resolveKey(key);
    const s = this._stats.get(resolvedKey);
    if (!s) {
      return { total: 0, allowed: 0, denied: 0 };
    }
    return { ...s };
  }
}