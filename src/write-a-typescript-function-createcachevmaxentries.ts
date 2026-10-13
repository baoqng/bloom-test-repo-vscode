// bloom-deps:

export function createCache<V>(
  maxEntries: number,
  ttlMs: number
): {
  get(key: string, nowMs: number): V | undefined;
  set(key: string, value: V, nowMs: number): void;
  size(nowMs: number): number;
} {
  // Validate maxEntries
  if (
    typeof maxEntries !== 'number' ||
    !Number.isSafeInteger(maxEntries) ||
    maxEntries <= 0
  ) {
    throw new RangeError('maxEntries must be a positive safe integer');
  }

  // Validate ttlMs
  if (
    typeof ttlMs !== 'number' ||
    !Number.isFinite(ttlMs) ||
    ttlMs <= 0
  ) {
    throw new RangeError('ttlMs must be a positive finite number');
  }

  // Map to store entries: key -> { value, timestamp }
  const entries = new Map<string, { value: V; timestamp: number }>();
  // Array to track insertion/access order for LRU eviction
  const lruOrder: string[] = [];

  function isExpired(timestamp: number, nowMs: number): boolean {
    return nowMs - timestamp >= ttlMs;
  }

  function removeExpiredEntries(nowMs: number): void {
    const keysToDelete: string[] = [];
    for (const [key, entry] of entries.entries()) {
      if (isExpired(entry.timestamp, nowMs)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      entries.delete(key);
      const idx = lruOrder.indexOf(key);
      if (idx !== -1) {
        lruOrder.splice(idx, 1);
      }
    }
  }

  function markMostRecentlyUsed(key: string): void {
    const idx = lruOrder.indexOf(key);
    if (idx !== -1) {
      lruOrder.splice(idx, 1);
    }
    lruOrder.push(key);
  }

  return {
    get(key: string, nowMs: number): V | undefined {
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }

      if (isExpired(entry.timestamp, nowMs)) {
        entries.delete(key);
        const idx = lruOrder.indexOf(key);
        if (idx !== -1) {
          lruOrder.splice(idx, 1);
        }
        return undefined;
      }

      markMostRecentlyUsed(key);
      return entry.value;
    },

    set(key: string, value: V, nowMs: number): void {
      const isNewKey = !entries.has(key);

      if (isNewKey) {
        removeExpiredEntries(nowMs);

        // Count live entries
        let liveCount = 0;
        for (const [, entry] of entries.entries()) {
          if (!isExpired(entry.timestamp, nowMs)) {
            liveCount++;
          }
        }

        // Evict LRU entries until we have room
        while (liveCount >= maxEntries && lruOrder.length > 0) {
          const lruKey = lruOrder.shift();
          if (lruKey) {
            entries.delete(lruKey);
            liveCount--;
          }
        }
      } else {
        // Existing key: remove from LRU tracking so we can re-add at end
        const idx = lruOrder.indexOf(key);
        if (idx !== -1) {
          lruOrder.splice(idx, 1);
        }
      }

      entries.set(key, { value, timestamp: nowMs });
      markMostRecentlyUsed(key);
    },

    size(nowMs: number): number {
      let count = 0;
      for (const [, entry] of entries.entries()) {
        if (!isExpired(entry.timestamp, nowMs)) {
          count++;
        }
      }
      return count;
    }
  };
}