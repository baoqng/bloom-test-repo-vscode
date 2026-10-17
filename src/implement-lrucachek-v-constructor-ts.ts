interface LRUEntry<K, V> {
  key: K;
  value: V;
  expiresAt: number | null;
  prev: LRUEntry<K, V> | null;
  next: LRUEntry<K, V> | null;
}

export class LRUCache<K, V> {
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly onEvict?: (key: K, value: V) => void;
  private readonly map: Map<K, LRUEntry<K, V>>;
  // head = MRU, tail = LRU
  private head: LRUEntry<K, V> | null;
  private tail: LRUEntry<K, V> | null;

  constructor(options: { maxSize: number; ttl?: number; onEvict?: (key: K, value: V) => void }) {
    const { maxSize, ttl = 0, onEvict } = options;
    if (maxSize < 1) {
      throw new RangeError(`maxSize must be >= 1, got ${maxSize}`);
    }
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.onEvict = onEvict;
    this.map = new Map();
    this.head = null;
    this.tail = null;
  }

  private isExpired(entry: LRUEntry<K, V>): boolean {
    if (entry.expiresAt === null) return false;
    const now = Date.now();
    return now >= entry.expiresAt;
  }

  private makeExpiry(): number | null {
    if (this.ttl === 0) return null;
    return Date.now() + this.ttl;
  }

  private detach(entry: LRUEntry<K, V>): void {
    if (entry.prev !== null) {
      entry.prev.next = entry.next;
    } else {
      // entry is head
      this.head = entry.next;
    }
    if (entry.next !== null) {
      entry.next.prev = entry.prev;
    } else {
      // entry is tail
      this.tail = entry.prev;
    }
    entry.prev = null;
    entry.next = null;
  }

  private prepend(entry: LRUEntry<K, V>): void {
    entry.prev = null;
    entry.next = this.head;
    if (this.head !== null) {
      this.head.prev = entry;
    }
    this.head = entry;
    if (this.tail === null) {
      this.tail = entry;
    }
  }

  private moveToHead(entry: LRUEntry<K, V>): void {
    if (this.head === entry) return;
    this.detach(entry);
    this.prepend(entry);
  }

  private evictLRU(): void {
    if (this.tail === null) return;
    const entry = this.tail;
    this.detach(entry);
    this.map.delete(entry.key);
    if (this.onEvict) {
      this.onEvict(entry.key, entry.value);
    }
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (entry === undefined) return undefined;
    if (this.isExpired(entry)) {
      this.detach(entry);
      this.map.delete(entry.key);
      if (this.onEvict) {
        this.onEvict(entry.key, entry.value);
      }
      return undefined;
    }
    this.moveToHead(entry);
    return entry.value;
  }

  set(key: K, value: V): this {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      existing.value = value;
      existing.expiresAt = this.makeExpiry();
      this.moveToHead(existing);
      return this;
    }
    const entry: LRUEntry<K, V> = {
      key,
      value,
      expiresAt: this.makeExpiry(),
      prev: null,
      next: null,
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
    if (entry === undefined) return false;
    if (this.isExpired(entry)) return false;
    return true;
  }

  delete(key: K): boolean {
    const entry = this.map.get(key);
    if (entry === undefined) return false;
    this.detach(entry);
    this.map.delete(key);
    return true;
  }

  peek(key: K): V | undefined {
    const entry = this.map.get(key);
    if (entry === undefined) return undefined;
    if (this.isExpired(entry)) return undefined;
    return entry.value;
  }

  clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  get size(): number {
    let count = 0;
    let current = this.head;
    while (current !== null) {
      if (!this.isExpired(current)) {
        count++;
      }
      current = current.next;
    }
    return count;
  }

  keys(): IterableIterator<K> {
    const self = this;
    let current = self.head;
    const iterator: IterableIterator<K> = {
      [Symbol.iterator]() {
        return iterator;
      },
      next(): IteratorResult<K> {
        while (current !== null) {
          const entry = current;
          current = current.next;
          if (!self.isExpired(entry)) {
            return { value: entry.key, done: false };
          }
        }
        return { value: undefined as unknown as K, done: true };
      },
    };
    return iterator;
  }

  entries(): IterableIterator<[K, V]> {
    const self = this;
    let current = self.head;
    const iterator: IterableIterator<[K, V]> = {
      [Symbol.iterator]() {
        return iterator;
      },
      next(): IteratorResult<[K, V]> {
        while (current !== null) {
          const entry = current;
          current = current.next;
          if (!self.isExpired(entry)) {
            return { value: [entry.key, entry.value], done: false };
          }
        }
        return { value: undefined as unknown as [K, V], done: true };
      },
    };
    return iterator;
  }
}