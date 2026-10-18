// bloom-deps:

export class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiresAt?: number }> = new Map();
  private accessOrder: K[] = [];
  private maxSize: number;
  private ttl?: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: { maxSize: number; ttl?: number; onEvict?: (key: K, value: V) => void }) {
    if (options.maxSize < 1) {
      throw new RangeError("maxSize must be at least 1");
    }
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
    this.onEvict = options.onEvict;
  }

  private isExpired(expiresAt?: number): boolean {
    if (expiresAt === undefined) {
      return false;
    }
    return Date.now() > expiresAt;
  }

  private removeFromAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private moveToMRU(key: K): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry === undefined) {
      return undefined;
    }

    if (this.isExpired(entry.expiresAt)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      if (this.onEvict) {
        this.onEvict(key, entry.value);
      }
      return undefined;
    }

    this.moveToMRU(key);
    return entry.value;
  }

  set(key: K, value: V): this {
    const isNewKey = !this.cache.has(key);

    const expiresAt = this.ttl && this.ttl > 0 ? Date.now() + this.ttl : undefined;
    this.cache.set(key, { value, expiresAt });

    if (isNewKey) {
      this.moveToMRU(key);

      if (this.cache.size > this.maxSize) {
        const lruKey = this.accessOrder.shift();
        if (lruKey !== undefined) {
          const lruEntry = this.cache.get(lruKey);
          this.cache.delete(lruKey);
          if (lruEntry && this.onEvict) {
            this.onEvict(lruKey, lruEntry.value);
          }
        }
      }
    } else {
      this.moveToMRU(key);
    }

    return this;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry === undefined) {
      return false;
    }

    if (this.isExpired(entry.expiresAt)) {
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }
    return existed;
  }

  peek(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry === undefined) {
      return undefined;
    }

    if (this.isExpired(entry.expiresAt)) {
      return undefined;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  get size(): number {
    let count = 0;
    for (const [, entry] of this.cache.entries()) {
      if (!this.isExpired(entry.expiresAt)) {
        count++;
      }
    }
    return count;
  }

  keys(): IterableIterator<K> {
    const self = this;
    return {
      [Symbol.iterator](): IterableIterator<K> {
        let index = self.accessOrder.length - 1;
        return {
          next(): IteratorResult<K> {
            while (index >= 0) {
              const key = self.accessOrder[index];
              index--;
              const entry = self.cache.get(key);
              if (entry !== undefined && !self.isExpired(entry.expiresAt)) {
                return { value: key, done: false };
              }
            }
            return { value: undefined as any, done: true };
          },
          [Symbol.iterator](): IterableIterator<K> {
            return this;
          },
        };
      },
    }[Symbol.iterator]();
  }

  entries(): IterableIterator<[K, V]> {
    const self = this;
    return {
      [Symbol.iterator](): IterableIterator<[K, V]> {
        let index = self.accessOrder.length - 1;
        return {
          next(): IteratorResult<[K, V]> {
            while (index >= 0) {
              const key = self.accessOrder[index];
              index--;
              const entry = self.cache.get(key);
              if (entry !== undefined && !self.isExpired(entry.expiresAt)) {
                return { value: [key, entry.value], done: false };
              }
            }
            return { value: undefined as any, done: true };
          },
          [Symbol.iterator](): IterableIterator<[K, V]> {
            return this;
          },
        };
      },
    }[Symbol.iterator]();
  }
}