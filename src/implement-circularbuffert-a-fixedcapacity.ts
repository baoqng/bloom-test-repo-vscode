// bloom-deps:

export class CircularBuffer<T> {
  private readonly _buf: (T | undefined)[];
  private _head: number = 0; // index of oldest item
  private _size: number = 0;
  private readonly _capacity: number;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(
        `CircularBuffer capacity must be an integer >= 1, got ${capacity}`
      );
    }
    this._capacity = capacity;
    this._buf = new Array(capacity);
  }

  get capacity(): number {
    return this._capacity;
  }

  get size(): number {
    return this._size;
  }

  get isFull(): boolean {
    return this._size === this._capacity;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  push(item: T): boolean {
    if (this._size === this._capacity) {
      // Overwrite oldest: oldest is at _head
      this._buf[this._head] = item;
      this._head = (this._head + 1) % this._capacity;
      return false;
    } else {
      // Write at the tail slot
      const tail = (this._head + this._size) % this._capacity;
      this._buf[tail] = item;
      this._size++;
      return true;
    }
  }

  pop(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }
    const item = this._buf[this._head] as T;
    this._buf[this._head] = undefined;
    this._head = (this._head + 1) % this._capacity;
    this._size--;
    return item;
  }

  peek(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }
    return this._buf[this._head] as T;
  }

  peekLast(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }
    const tailIndex = (this._head + this._size - 1) % this._capacity;
    return this._buf[tailIndex] as T;
  }

  drain(): T[] {
    if (this._size === 0) {
      return [];
    }
    const result = this.toArray();
    this._head = 0;
    this._size = 0;
    this._buf.fill(undefined);
    return result;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      result.push(this._buf[(this._head + i) % this._capacity] as T);
    }
    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    const buf = this._buf;
    const head = this._head;
    const size = this._size;
    const capacity = this._capacity;
    let index = 0;

    return {
      next(): IteratorResult<T> {
        if (index < size) {
          const value = buf[(head + index) % capacity] as T;
          index++;
          return { value, done: false };
        }
        return { value: undefined as unknown as T, done: true };
      }
    };
  }
}