// bloom-deps:

export class LRUCache<K, V> {
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: K, value: V) => void;

  // Doubly linked list node
  private head: { key: K; value: V; expiresAt: number; prev: any; next: any } | null = null;
  private tail: { key: K; value: V; expiresAt: number; prev: any; next: any } | null = null;
  private map: Map<K, { key: K; value: V; expiresAt: number; prev: any; next: any }> = new Map();

  constructor(options: { maxSize: number; ttl?: number; onEvict?: (key: K, value: V) => void }) {
    if (options.maxSize < 1) {
      throw new RangeError(`maxSize must be >= 1, got ${options.maxSize}`);
    }
    this.maxSize = options.maxSize;
    this.ttl = options.ttl ?? 0;
    this.onEvict = options.onEvict;
  }

  private isExpired(node: { expiresAt: number }): boolean {
    if (node.expiresAt === 0) return false;
    return Date.now() >= node.expiresAt;
  }

  private removeNode(node: { key: K; value: V; expiresAt: number; prev: any; next: any }): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
    this.map.delete(node.key);
  }

  private insertAtHead(node: { key: K; value: V; expiresAt: number; prev: any; next: any }): void {
    node.next = this.head;
    node.prev = null;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (this.tail === null) {
      this.tail = node;
    }
    this.map.set(node.key, node);
  }

  private moveToHead(node: { key: K; value: V; expiresAt: number; prev: any; next: any }): void {
    if (this.head === node) return;
    this.removeNode(node);
    this.insertAtHead(node);
    this.map.set(node.key, node);
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    if (this.isExpired(node)) {
      this.removeNode(node);
      if (this.onEvict) {
        this.onEvict(node.key, node.value);
      }
      return undefined;
    }
    this.moveToHead(node);
    return node.value;
  }

  set(key: K, value: V): this {
    const existing = this.map.get(key);
    const expiresAt = this.ttl > 0 ? Date.now() + this.ttl : 0;

    if (existing) {
      existing.value = value;
      existing.expiresAt = expiresAt;
      this.moveToHead(existing);
      return this;
    }

    const node = { key, value, expiresAt, prev: null, next: null };
    this.insertAtHead(node);

    if (this.map.size > this.maxSize) {
      // Evict LRU (tail)
      const lru = this.tail!;
      this.removeNode(lru);
      if (this.onEvict) {
        this.onEvict(lru.key, lru.value);
      }
    }

    return this;
  }

  has(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    if (this.isExpired(node)) return false;
    return true;
  }

  delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.removeNode(node);
    return true;
  }

  peek(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    if (this.isExpired(node)) return undefined;
    return node.value;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.map.clear();
  }

  get size(): number {
    let count = 0;
    let node = this.head;
    while (node) {
      if (!this.isExpired(node)) {
        count++;
      }
      node = node.next;
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
              const node = current;
              current = current.next;
              if (!self.isExpired(node)) {
                return { value: node.key, done: false };
              }
            }
            return { value: undefined as any, done: true };
          },
          [Symbol.iterator]() { return this; }
        };
      },
      next(): IteratorResult<K> {
        let current = self.head;
        while (current) {
          const node = current;
          current = current.next;
          if (!self.isExpired(node)) {
            return { value: node.key, done: false };
          }
        }
        return { value: undefined as any, done: true };
      }
    } as any;
  }

  entries(): IterableIterator<[K, V]> {
    const self = this;
    return {
      [Symbol.iterator]() {
        let current = self.head;
        return {
          next(): IteratorResult<[K, V]> {
            while (current) {
              const node = current;
              current = current.next;
              if (!self.isExpired(node)) {
                return { value: [node.key, node.value] as [K, V], done: false };
              }
            }
            return { value: undefined as any, done: true };
          },
          [Symbol.iterator]() { return this; }
        };
      },
      next(): IteratorResult<[K, V]> {
        let current = self.head;
        while (current) {
          const node = current;
          current = current.next;
          if (!self.isExpired(node)) {
            return { value: [node.key, node.value] as [K, V], done: false };
          }
        }
        return { value: undefined as any, done: true };
      }
    } as any;
  }
}