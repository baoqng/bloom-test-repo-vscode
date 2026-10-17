export class LRUCache<K, V> {
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: K, value: V) => void;

  // Doubly linked list node
  private head: { key: K | null; value: V | null; expireAt: number; prev: any; next: any };
  private tail: { key: K | null; value: V | null; expireAt: number; prev: any; next: any };

  private map: Map<K, { key: K; value: V; expireAt: number; prev: any; next: any }>;

  constructor(options: { maxSize: number; ttl?: number; onEvict?: (key: K, value: V) => void }) {
    const { maxSize, ttl = 0, onEvict } = options;
    if (maxSize < 1) {
      throw new RangeError(`maxSize must be >= 1, got ${maxSize}`);
    }
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.onEvict = onEvict;
    this.map = new Map();

    // sentinel head (MRU side) and tail (LRU side)
    this.head = { key: null, value: null, expireAt: 0, prev: null, next: null };
    this.tail = { key: null, value: null, expireAt: 0, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private isExpired(node: { expireAt: number }): boolean {
    if (this.ttl === 0) return false;
    return Date.now() > node.expireAt;
  }

  private removeNode(node: { prev: any; next: any }): void {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  private insertAfterHead(node: { prev: any; next: any }): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  private makeExpireAt(): number {
    if (this.ttl === 0) return 0;
    return Date.now() + this.ttl;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    if (this.isExpired(node)) {
      this.map.delete(key);
      this.removeNode(node);
      if (this.onEvict) this.onEvict(node.key, node.value);
      return undefined;
    }
    // Move to MRU
    this.removeNode(node);
    this.insertAfterHead(node);
    return node.value;
  }

  set(key: K, value: V): this {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      existing.expireAt = this.makeExpireAt();
      this.removeNode(existing);
      this.insertAfterHead(existing);
      return this;
    }

    const node = { key, value, expireAt: this.makeExpireAt(), prev: null, next: null };
    this.map.set(key, node);
    this.insertAfterHead(node);

    if (this.map.size > this.maxSize) {
      // Evict LRU (node before tail)
      const lruNode = this.tail.prev;
      if (lruNode !== this.head) {
        this.map.delete(lruNode.key);
        this.removeNode(lruNode);
        if (this.onEvict) this.onEvict(lruNode.key, lruNode.value);
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
    this.map.delete(key);
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
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    if (this.ttl === 0) return this.map.size;
    let count = 0;
    const now = Date.now();
    for (const node of this.map.values()) {
      if (node.expireAt === 0 || now <= node.expireAt) count++;
    }
    return count;
  }

  keys(): IterableIterator<K> {
    const iter = this._iterNodes();
    const result: IterableIterator<K> = {
      next(): IteratorResult<K> {
        const r = iter.next();
        if (r.done) return { value: undefined as any, done: true };
        return { value: r.value.key, done: false };
      },
      [Symbol.iterator]() { return this; }
    };
    return result;
  }

  entries(): IterableIterator<[K, V]> {
    const iter = this._iterNodes();
    const result: IterableIterator<[K, V]> = {
      next(): IteratorResult<[K, V]> {
        const r = iter.next();
        if (r.done) return { value: undefined as any, done: true };
        return { value: [r.value.key, r.value.value], done: false };
      },
      [Symbol.iterator]() { return this; }
    };
    return result;
  }

  private _iterNodes(): Iterator<{ key: K; value: V; expireAt: number }> {
    const now = Date.now();
    const ttl = this.ttl;
    let current = this.head.next;
    const tail = this.tail;

    return {
      next(): IteratorResult<{ key: K; value: V; expireAt: number }> {
        while (current !== tail) {
          const node = current;
          current = current.next;
          if (ttl === 0 || now <= node.expireAt) {
            return { value: node, done: false };
          }
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}