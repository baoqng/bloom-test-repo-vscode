// bloom-deps:

interface LRUEntry<K, V> {
  key: K;
  value: V;
  expiresAt: number | undefined;
  prev: LRUEntry<K, V> | undefined;
  next: LRUEntry<K, V> | undefined;
}

export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly onEvict: ((key: K, value: V) => void) | undefined;

  // Doubly-linked list: head = MRU, tail = LRU
  private head: LRUEntry<K, V> | undefined;
  private tail: LRUEntry<K, V> | undefined;
  private readonly map: Map<K, LRUEntry<K, V>>;

  constructor(options: { maxSize: number; ttl?: number; onEvict?: (key: K, value: V) => void }) {
    const { maxSize, ttl = 0, onEvict } = options;
    if (maxSize < 1) {
      throw new RangeError(`maxSize must be >= 1, got ${maxSize}`);
    }
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.onEvict = onEvict;
    this.map = new Map();
  }

  private isExpired(entry: LRUEntry<K, V>): boolean {
    if (entry.expiresAt === undefined) return false;
    return Date.now() >= entry.expiresAt;
  }

  private makeExpiry(): number | undefined {
    if (this.ttl === 0) return undefined;
    return Date.now() + this.ttl;
  }

  private detach(entry: LRUEntry<K, V>): void {
    if (entry.prev) entry.prev.next = entry.next;
    else this.head = entry.next;

    if (entry.next) entry.next.prev = entry.prev;
    else this.tail = entry.prev;

    entry.prev = undefined;
    entry.next = undefined;
  }

  private prepend(entry: LRUEntry<K, V>): void {
    entry.prev = undefined;
    entry.next = this.head;
    if (this.head) this.head.prev = entry;
    this.head = entry;
    if (!this.tail) this.tail = entry;
  }

  private moveToHead(entry: LRUEntry<K, V>): void {
    if (this.head === entry) return;
    this.detach(entry);
    this.prepend(entry);
  }

  private evictLRU(): void {
    const lru = this.tail;
    if (!lru) return;
    this.detach(lru);
    this.map.delete(lru.key);
    if (this.onEvict) this.onEvict(lru.key, lru.value);
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.detach(entry);
      this.map.delete(key);
      if (this.onEvict) this.onEvict(entry.key, entry.value);
      return undefined;
    }
    this.moveToHead(entry);
    return entry.value;
  }

  set(key: K, value: V): this {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      existing.expiresAt = this.makeExpiry();
      this.moveToHead(existing);
      return this;
    }

    const entry: LRUEntry<K, V> = {
      key,
      value,
      expiresAt: this.makeExpiry(),
      prev: undefined,
      next: undefined,
    };

    this.map.set(key, entry);
    this.prepend(entry);

    if (this.map.size > this.maxSize) {
      this.evictLRU();
    }

    return this;
  }

  has(key: K): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) return false;
    return true;
  }

  delete(key: K): boolean {
    const entry = this.map.get(key);
    if (!entry) return false;
    this.detach(entry);
    this.map.delete(key);
    return true;
  }

  peek(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) return undefined;
    return entry.value;
  }

  clear(): void {
    this.map.clear();
    this.head = undefined;
    this.tail = undefined;
  }

  get size(): number {
    let count = 0;
    let current = this.head;
    while (current) {
      if (!this.isExpired(current)) count++;
      current = current.next;
    }
    return count;
  }

  keys(): IterableIterator<K> {
    const self = this;
    return {
      [Symbol.iterator]() {
        let current = self.head;
        return {
          next(): IteratorResult<K> {
            while (current) {
              const entry = current;
              current = entry.next;
              if (!self.isExpired(entry)) {
                return { value: entry.key, done: false };
              }
            }
            return { value: undefined as unknown as K, done: true };
          },
          [Symbol.iterator]() { return this; },
        };
      },
      next(): IteratorResult<K> {
        return this[Symbol.iterator]().next();
      },
    } as IterableIterator<K>;
  }

  entries(): IterableIterator<[K, V]> {
    const self = this;
    return {
      [Symbol.iterator]() {
        let current = self.head;
        return {
          next(): IteratorResult<[K, V]> {
            while (current) {
              const entry = current;
              current = entry.next;
              if (!self.isExpired(entry)) {
                return { value: [entry.key, entry.value] as [K, V], done: false };
              }
            }
            return { value: undefined as unknown as [K, V], done: true };
          },
          [Symbol.iterator]() { return this; },
        };
      },
      next(): IteratorResult<[K, V]> {
        return this[Symbol.iterator]().next();
      },
    } as IterableIterator<[K, V]>;
  }
}