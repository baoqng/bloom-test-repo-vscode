interface DequeNode<T> {
  value: T;
  prev: DequeNode<T> | null;
  next: DequeNode<T> | null;
}

export class Deque<T> {
  private _head: DequeNode<T> | null = null;
  private _tail: DequeNode<T> | null = null;
  private _size: number = 0;

  pushFront(item: T): void {
    const node: DequeNode<T> = { value: item, prev: null, next: this._head };
    if (this._head !== null) {
      this._head.prev = node;
    } else {
      this._tail = node;
    }
    this._head = node;
    this._size++;
  }

  pushBack(item: T): void {
    const node: DequeNode<T> = { value: item, prev: this._tail, next: null };
    if (this._tail !== null) {
      this._tail.next = node;
    } else {
      this._head = node;
    }
    this._tail = node;
    this._size++;
  }

  popFront(): T | undefined {
    if (this._head === null) {
      return undefined;
    }
    const value = this._head.value;
    this._head = this._head.next;
    if (this._head !== null) {
      this._head.prev = null;
    } else {
      this._tail = null;
    }
    this._size--;
    return value;
  }

  popBack(): T | undefined {
    if (this._tail === null) {
      return undefined;
    }
    const value = this._tail.value;
    this._tail = this._tail.prev;
    if (this._tail !== null) {
      this._tail.next = null;
    } else {
      this._head = null;
    }
    this._size--;
    return value;
  }

  peekFront(): T | undefined {
    if (this._head === null) {
      return undefined;
    }
    return this._head.value;
  }

  peekBack(): T | undefined {
    if (this._tail === null) {
      return undefined;
    }
    return this._tail.value;
  }

  get size(): number {
    return this._size;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this._head;
    while (current !== null) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    let current = this._head;
    return {
      next(): IteratorResult<T> {
        if (current !== null) {
          const value = current.value;
          current = current.next;
          return { value, done: false };
        }
        return { value: undefined as unknown as T, done: true };
      }
    };
  }

  clear(): void {
    this._head = null;
    this._tail = null;
    this._size = 0;
  }

  at(index: number): T | undefined {
    if (index === null || index === undefined || typeof index !== 'number' || isNaN(index)) {
      throw new Error('Invalid index: index must be a number');
    }

    // Handle -0 as 0
    const idx = index === 0 ? 0 : index;

    let normalizedIndex: number;
    if (idx < 0) {
      normalizedIndex = this._size + idx;
    } else {
      normalizedIndex = idx;
    }

    if (normalizedIndex < 0 || normalizedIndex >= this._size) {
      return undefined;
    }

    // Optimize by traversing from closer end
    if (normalizedIndex <= this._size / 2) {
      let current = this._head;
      for (let i = 0; i < normalizedIndex; i++) {
        current = current!.next;
      }
      return current!.value;
    } else {
      let current = this._tail;
      for (let i = this._size - 1; i > normalizedIndex; i--) {
        current = current!.prev;
      }
      return current!.value;
    }
  }
}