// bloom-deps:

export function memoizeAsync<K, V>(
  fn: (key: K) => Promise<V>,
  options?: { maxSize?: number; ttlMs?: number }
): (key: K) => Promise<V> {
  const { maxSize, ttlMs } = options ?? {};

  if (maxSize !== undefined) {
    if (!Number.isInteger(maxSize) || maxSize <= 0) {
      throw new RangeError(`maxSize must be a positive integer, got ${maxSize}`);
    }
  }

  if (ttlMs !== undefined) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new RangeError(`ttlMs must be a positive finite number, got ${ttlMs}`);
    }
  }

  interface CacheEntry {
    value: V;
    resolvedAt: number;
  }

  // LRU cache: use a Map (insertion/access order maintained via delete+set)
  const cache = new Map<K, CacheEntry>();
  const inFlight = new Map<K, Promise<V>>();

  function isExpired(entry: CacheEntry): boolean {
    if (ttlMs === undefined) return false;
    const now = Date.now();
    return now - entry.resolvedAt >= ttlMs;
  }

  function promoteKey(key: K): void {
    const entry = cache.get(key);
    if (entry !== undefined) {
      cache.delete(key);
      cache.set(key, entry);
    }
  }

  function evictLRU(): void {
    const firstKey = cache.keys().next();
    if (!firstKey.done) {
      cache.delete(firstKey.value);
    }
  }

  return function memoized(key: K): Promise<V> {
    // Check cache hit
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (!isExpired(entry)) {
        promoteKey(key);
        return Promise.resolve(entry.value);
      } else {
        // Expired: remove from cache
        cache.delete(key);
      }
    }

    // Check in-flight deduplication
    if (inFlight.has(key)) {
      return inFlight.get(key)!;
    }

    // Cache miss: call fn
    const promise: Promise<V> = fn(key).then(
      (value: V) => {
        inFlight.delete(key);

        // Evict LRU if needed before adding new entry
        if (maxSize !== undefined && !cache.has(key) && cache.size >= maxSize) {
          evictLRU();
        }

        cache.set(key, { value, resolvedAt: Date.now() });
        return value;
      },
      (err: unknown) => {
        inFlight.delete(key);
        throw err;
      }
    );

    inFlight.set(key, promise);
    return promise;
  };
}