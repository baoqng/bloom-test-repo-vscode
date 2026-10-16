// bloom-deps:

interface LRUCacheOptions<K, V> {
  capacity: number;
  defaultTtlMs?: number;
  onEvict?: (key: K, value: V, reason: 'capacity' | 'ttl' | 'delete') => void;
}

interface Entry<K, V> {
  key: K;
  value: V;
  expiresAt: number | undefined;
  prev: Entry<K, V> | undefined;
  next: Entry<K, V> | undefined;
}

export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly defaultTtlMs: number | undefined;
  private readonly onEvict: ((key: K, value: V, reason: 'capacity' | 'ttl' | 'delete') => void) | undefined;

  // Map for O(1) lookup
  private readonly map: Map<K, Entry<K, V>>;

  // Doubly-linked list: head = LRU (oldest), tail = MRU (newest)
  private head: Entry<K, V> | undefined;
  private tail: Entry<K, V> | undefined;

  constructor(options: LRUCacheOptions<K, V>) {
    const { capacity, defaultTtlMs, onEvict } = options;

    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`capacity must be an integer >= 1, got ${capacity}`);
    }

    if (defaultTtlMs !== undefined) {
      if (defaultTtlMs <= 0) {
        throw new RangeError(`defaultTtlMs must be > 0, got ${defaultTtlMs}`);
      }
    }

    this.capacity = capacity;
    this.defaultTtlMs = defaultTtlMs;
    this.onEvict = onEvict;
    this.map = new Map();
    this.head = undefined;
    this.tail = undefined;
  }

  set(key: K, value: V, ttlMs?: number): void {
    const effectiveTtl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    const expiresAt = effectiveTtl !== undefined ? Date.now() + effectiveTtl : undefined;

    const existing = this.map.get(key);
    if (existing !== undefined) {
      // Update existing entry
      existing.value = value;
      existing.expiresAt = expiresAt;
      this.moveToTail(existing);
      return;
    }

    // Evict LRU if at capacity
    if (this.map.size >= this.capacity) {
      this.evictHead('capacity');
    }

    const entry: Entry<K, V> = {
      key,
      value,
      expiresAt,
      prev: undefined,
      next: undefined,
    };

    this.map.set(key, entry);
    this.appendToTail(entry);
  }

  get(key: K, nowMs?: number): V | undefined {
    const entry = this.map.get(key);
    if (entry === undefined) {
      return undefined;
    }

    const now = nowMs !== undefined ? nowMs : Date.now();
    if (this.isExpired(entry, now)) {
      this.removeEntry(entry, 'ttl');
      return undefined;
    }

    this.moveToTail(entry);
    return entry.value;
  }

  has(key: K, nowMs?: number): boolean {
    const entry = this.map.get(key);
    if (entry === undefined) {
      return false;
    }

    const now = nowMs !== undefined ? nowMs : Date.now();
    if (this.isExpired(entry, now)) {
      this.removeEntry(entry, 'ttl');
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const entry = this.map.get(key);
    if (entry === undefined) {
      return false;
    }
    this.removeEntry(entry, 'delete');
    return true;
  }

  clear(): void {
    // Collect all entries first, then evict each
    const entries: Entry<K, V>[] = [];
    let current = this.head;
    while (current !== undefined) {
      entries.push(current);
      current = current.next;
    }

    this.map.clear();
    this.head = undefined;
    this.tail = undefined;

    for (const entry of entries) {
      this.onEvict?.(entry.key, entry.value, 'delete');
    }
  }

  get size(): number {
    const now = Date.now();
    let count = 0;
    let current = this.head;
    while (current !== undefined) {
      if (!this.isExpired(current, now)) {
        count++;
      }
      current = current.next;
    }
    return count;
  }

  private isExpired(entry: Entry<K, V>, now: number): boolean {
    if (entry.expiresAt === undefined) {
      return false;
    }
    return now >= entry.expiresAt;
  }

  private appendToTail(entry: Entry<K, V>): void {
    entry.prev = this.tail;
    entry.next = undefined;

    if (this.tail !== undefined) {
      this.tail.next = entry;
    }
    this.tail = entry;

    if (this.head === undefined) {
      this.head = entry;
    }
  }

  private removeFromList(entry: Entry<K, V>): void {
    if (entry.prev !== undefined) {
      entry.prev.next = entry.next;
    } else {
      // entry is head
      this.head = entry.next;
    }

    if (entry.next !== undefined) {
      entry.next.prev = entry.prev;
    } else {
      // entry is tail
      this.tail = entry.prev;
    }

    entry.prev = undefined;
    entry.next = undefined;
  }

  private moveToTail(entry: Entry<K, V>): void {
    if (this.tail === entry) {
      return; // Already MRU
    }
    this.removeFromList(entry);
    this.appendToTail(entry);
  }

  private removeEntry(entry: Entry<K, V>, reason: 'capacity' | 'ttl' | 'delete'): void {
    this.map.delete(entry.key);
    this.removeFromList(entry);
    this.onEvict?.(entry.key, entry.value, reason);
  }

  private evictHead(reason: 'capacity' | 'ttl' | 'delete'): void {
    if (this.head === undefined) {
      return;
    }
    this.removeEntry(this.head, reason);
  }
}