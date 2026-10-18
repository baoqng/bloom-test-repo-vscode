// bloom-deps:

export class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number | null }> = new Map();
  private maxSize: number;
  private ttl: number | undefined;
  private onEvict: ((key: K, value: V) => void) | undefined;

  constructor(options: {
    maxSize: number;
    ttl?: number;
    onEvict?: (key: K, value: V) => void;
  }) {
    if (options.maxSize < 1) {
      throw new RangeError('maxSize must be at least 1');
    }
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
    this.onEvict = options.onEvict;
  }

  private isExpired(expiresAt: number | null): boolean {
    if (expiresAt === null) return false;
    return Date.now() >= expiresAt;
  }

  private calculateExpiry(): number | null {
    if (this.ttl === undefined || this.ttl === 0) return null;
    return Date.now() + this.ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry.expiresAt)) {
      this.cache.delete(key);
      if (this.onEvict) {
        this.onEvict(key, entry.value);
      }
      return undefined;
    }

    // Move to MRU (end of map)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): this {
    const exists = this.cache.has(key);

    if (exists) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      value,
      expiresAt: this.calculateExpiry(),
    });

    // If new entry and at capacity, evict LRU
    if (!exists && this.cache.size > this.maxSize) {
      const lruKey = this.cache.keys().next().value;
      const lruEntry = this.cache.get(lruKey);
      this.cache.delete(lruKey);
      if (this.onEvict && lruEntry) {
        this.onEvict(lruKey, lruEntry.value);
      }
    }

    return this;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry.expiresAt)) {
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  peek(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry.expiresAt)) {
      return undefined;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    let count = 0;
    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry.expiresAt)) {
        count++;
      }
    }
    return count;
  }

  keys(): IterableIterator<K> {
    return {
      [Symbol.iterator]: () => {
        const keysArray: K[] = [];
        for (const [k, entry] of this.cache) {
          if (!this.isExpired(entry.expiresAt)) {
            keysArray.unshift(k);
          }
        }
        return keysArray[Symbol.iterator]();
      },
    }[Symbol.iterator]();
  }

  entries(): IterableIterator<[K, V]> {
    return {
      [Symbol.iterator]: () => {
        const entriesArray: [K, V][] = [];
        for (const [k, entry] of this.cache) {
          if (!this.isExpired(entry.expiresAt)) {
            entriesArray.unshift([k, entry.value]);
          }
        }
        return entriesArray[Symbol.iterator]();
      },
    }[Symbol.iterator]();
  }
}