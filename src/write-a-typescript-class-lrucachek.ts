// bloom-deps:

interface Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null;
  next: Node<K, V> | null;
}

class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, Node<K, V>>;
  private head: Node<K, V> | null;
  private tail: Node<K, V> | null;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError("capacity must be a positive integer");
    }
    this.capacity = capacity;
    this.map = new Map();
    this.head = null;
    this.tail = null;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (node === undefined) {
      return undefined;
    }
    this.moveToHead(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existingNode = this.map.get(key);
    if (existingNode !== undefined) {
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    const newNode: Node<K, V> = {
      key,
      value,
      prev: null,
      next: null,
    };

    this.map.set(key, newNode);
    this.insertAtHead(newNode);

    if (this.map.size > this.capacity) {
      const lruNode = this.tail;
      if (lruNode !== null) {
        this.removeNode(lruNode);
        this.map.delete(lruNode.key);
      }
    }
  }

  delete(key: K): boolean {
    const node = this.map.get(key);
    if (node === undefined) {
      return false;
    }
    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  private moveToHead(node: Node<K, V>): void {
    this.removeNode(node);
    this.insertAtHead(node);
  }

  private insertAtHead(node: Node<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head !== null) {
      this.head.prev = node;
    }

    this.head = node;

    if (this.tail === null) {
      this.tail = node;
    }
  }

  private removeNode(node: Node<K, V>): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }
}

export { LRUCache };