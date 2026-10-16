// bloom-deps:

interface MemoOptions {
  ttl?: number;
  maxSize?: number;
  keyFn?: (...args: unknown[]) => string;
}

interface MemoizedFn<T> {
  (...args: unknown[]): Promise<T>;
  invalidate(...args: unknown[]): void;
  invalidateAll(): void;
  readonly size: number;
}

interface CacheEntry<T> {
  promise: Promise<T>;
  resolved: boolean;
  value?: T;
  expiresAt?: number;
  lruOrder: number;
}

export function memoizeAsync<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options?: MemoOptions
): MemoizedFn<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('fn must be a function');
  }

  const ttl = options?.ttl ?? 0;
  const maxSize = options?.maxSize;
  const keyFn = options?.keyFn ?? ((...args: unknown[]) => JSON.stringify(args));

  if (ttl < 0) {
    throw new RangeError('ttl must be >= 0');
  }

  if (maxSize !== undefined && maxSize < 1) {
    throw new RangeError('maxSize must be >= 1');
  }

  const cache = new Map<string, CacheEntry<T>>();
  let lruCounter = 0;
  let sweepInterval: ReturnType<typeof setInterval> | null = null;

  function isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.resolved) return false;
    if (entry.expiresAt === undefined) return false;
    return Date.now() >= entry.expiresAt;
  }

  function evictLRU(): void {
    let lruKey: string | null = null;
    let lruOrder = Infinity;
    for (const [key, entry] of cache.entries()) {
      if (entry.lruOrder < lruOrder) {
        lruOrder = entry.lruOrder;
        lruKey = key;
      }
    }
    if (lruKey !== null) {
      cache.delete(lruKey);
    }
  }

  function sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.resolved && entry.expiresAt !== undefined && now >= entry.expiresAt) {
        cache.delete(key);
      }
    }
    if (cache.size === 0 && sweepInterval !== null) {
      clearInterval(sweepInterval);
      sweepInterval = null;
    }
  }

  function startSweepIfNeeded(): void {
    if (maxSize !== undefined && ttl > 0 && sweepInterval === null) {
      sweepInterval = setInterval(() => {
        sweepExpired();
      }, Math.max(ttl / 2, 100));
      if (sweepInterval && typeof sweepInterval === 'object' && 'unref' in sweepInterval) {
        (sweepInterval as NodeJS.Timeout).unref();
      }
    }
  }

  function memoized(...args: unknown[]): Promise<T> {
    const key = keyFn(...args);

    const existing = cache.get(key);
    if (existing !== undefined) {
      if (isExpired(existing)) {
        cache.delete(key);
      } else {
        existing.lruOrder = ++lruCounter;
        return existing.promise;
      }
    }

    const entry: CacheEntry<T> = {
      promise: null as unknown as Promise<T>,
      resolved: false,
      lruOrder: ++lruCounter,
    };

    const promise = (async () => {
      try {
        const result = await fn(...args);
        entry.resolved = true;
        entry.value = result;
        if (ttl > 0) {
          entry.expiresAt = Date.now() + ttl;
          startSweepIfNeeded();
        }
        return result;
      } catch (err) {
        cache.delete(key);
        throw err;
      }
    })();

    entry.promise = promise;

    if (maxSize !== undefined && cache.size >= maxSize) {
      evictLRU();
    }

    cache.set(key, entry);

    return promise;
  }

  memoized.invalidate = function (...args: unknown[]): void {
    const key = keyFn(...args);
    cache.delete(key);
  };

  memoized.invalidateAll = function (): void {
    cache.clear();
  };

  Object.defineProperty(memoized, 'size', {
    get() {
      return cache.size;
    },
    enumerable: true,
    configurable: true,
  });

  return memoized as MemoizedFn<T>;
}