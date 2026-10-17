// bloom-deps:

export class BoundedQueue<T> {
  private readonly _capacity: number;
  private readonly _items: T[];

  constructor(capacity: number) {
    if (
      typeof capacity !== 'number' ||
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      !Number.isFinite(capacity)
    ) {
      throw new RangeError(
        `capacity must be a positive integer, got: ${capacity}`
      );
    }
    this._capacity = capacity;
    this._items = [];
  }

  enqueue(item: T): boolean {
    if (this._items.length >= this._capacity) {
      return false;
    }
    this._items.push(item);
    return true;
  }

  dequeue(): T | undefined {
    if (this._items.length === 0) {
      return undefined;
    }
    return this._items.shift();
  }

  peek(): T | undefined {
    if (this._items.length === 0) {
      return undefined;
    }
    return this._items[0];
  }

  get size(): number {
    return this._items.length;
  }

  get capacity(): number {
    return this._capacity;
  }

  get isEmpty(): boolean {
    return this._items.length === 0;
  }

  get isFull(): boolean {
    return this._items.length === this._capacity;
  }
}