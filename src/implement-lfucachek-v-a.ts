// bloom-deps:

export class LFUCache<K, V> {
  private capacity: number;
  private _size: number = 0;
  private minFreq: number = 0;

  // key -> { value, freq }
  private keyMap: Map<K, { value: V; freq: number }> = new Map();

  // freq -> doubly-linked list of keys (insertion order = LRU order)
  private freqMap: Map<number, DoublyLinkedList<K>> = new Map();

  constructor(capacity: number) {
    if (capacity < 1) {
      throw new RangeError(`LFUCache capacity must be >= 1, got ${capacity}`);
    }
    this.capacity = capacity;
  }

  get size(): number {
    return this._size;
  }

  get(key: K): V | undefined {
    const entry = this.keyMap.get(key);
    if (entry === undefined) {
      return undefined;
    }
    this.incrementFreq(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    const entry = this.keyMap.get(key);
    if (entry !== undefined) {
      // Update existing key: update value and increment frequency
      entry.value = value;
      this.incrementFreq(key, entry);
      return;
    }

    // New key
    if (this._size >= this.capacity) {
      // Evict LFU (LRU among ties)
      const minList = this.freqMap.get(this.minFreq)!;
      const evictKey = minList.removeFront();
      if (minList.isEmpty()) {
        this.freqMap.delete(this.minFreq);
      }
      this.keyMap.delete(evictKey);
      this._size--;
    }

    // Insert new key with frequency 1
    this.keyMap.set(key, { value, freq: 1 });
    if (!this.freqMap.has(1)) {
      this.freqMap.set(1, new DoublyLinkedList<K>());
    }
    this.freqMap.get(1)!.addBack(key);
    this.minFreq = 1;
    this._size++;
  }

  has(key: K): boolean {
    return this.keyMap.has(key);
  }

  delete(key: K): boolean {
    const entry = this.keyMap.get(key);
    if (entry === undefined) {
      return false;
    }
    const freq = entry.freq;
    const list = this.freqMap.get(freq);
    if (list !== undefined) {
      list.remove(key);
      if (list.isEmpty()) {
        this.freqMap.delete(freq);
      }
    }
    this.keyMap.delete(key);
    this._size--;
    return true;
  }

  peek(key: K): V | undefined {
    const entry = this.keyMap.get(key);
    return entry !== undefined ? entry.value : undefined;
  }

  clear(): void {
    this.keyMap.clear();
    this.freqMap.clear();
    this._size = 0;
    this.minFreq = 0;
  }

  private incrementFreq(key: K, entry: { value: V; freq: number }): void {
    const oldFreq = entry.freq;
    const oldList = this.freqMap.get(oldFreq)!;
    oldList.remove(key);
    if (oldList.isEmpty()) {
      this.freqMap.delete(oldFreq);
      if (this.minFreq === oldFreq) {
        this.minFreq = oldFreq + 1;
      }
    }

    const newFreq = oldFreq + 1;
    entry.freq = newFreq;
    if (!this.freqMap.has(newFreq)) {
      this.freqMap.set(newFreq, new DoublyLinkedList<K>());
    }
    this.freqMap.get(newFreq)!.addBack(key);
  }
}

// Internal doubly-linked list node
class DLLNode<T> {
  key: T;
  prev: DLLNode<T> | null = null;
  next: DLLNode<T> | null = null;

  constructor(key: T) {
    this.key = key;
  }
}

// Doubly-linked list where:
// - front (head.next) is the LEAST recently used
// - back (tail.prev) is the MOST recently used
// Also maintains a nodeMap for O(1) removal by key
class DoublyLinkedList<T> {
  private head: DLLNode<T>;
  private tail: DLLNode<T>;
  private nodeMap: Map<T, DLLNode<T>> = new Map();

  constructor() {
    // Sentinel nodes
    this.head = new DLLNode<T>(null as unknown as T);
    this.tail = new DLLNode<T>(null as unknown as T);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  addBack(key: T): void {
    const node = new DLLNode(key);
    const prev = this.tail.prev!;
    prev.next = node;
    node.prev = prev;
    node.next = this.tail;
    this.tail.prev = node;
    this.nodeMap.set(key, node);
  }

  removeFront(): T {
    const node = this.head.next!;
    this.removeNode(node);
    return node.key;
  }

  remove(key: T): void {
    const node = this.nodeMap.get(key);
    if (node !== undefined) {
      this.removeNode(node);
    }
  }

  isEmpty(): boolean {
    return this.head.next === this.tail;
  }

  private removeNode(node: DLLNode<T>): void {
    const prev = node.prev!;
    const next = node.next!;
    prev.next = next;
    next.prev = prev;
    node.prev = null;
    node.next = null;
    this.nodeMap.delete(node.key);
  }
}