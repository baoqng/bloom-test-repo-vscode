interface DequeNode<T> {
  value: T;
  prev: DequeNode<T> | null;
  next: DequeNode<T> | null;
}

export class Deque<T> {
  private head: DequeNode<T> | null = null;
  private tail: DequeNode<T> | null = null;
  private _size: number = 0;

  private createNode(value: T): DequeNode<T> {
    return { value, prev: null, next: null };
  }

  pushFront(item: T): void {
    const node = this.createNode(item);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this._size++;
  }

  pushBack(item: T): void {
    const node = this.createNode(item);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this._size++;
  }

  popFront(): T | undefined {
    if (this.head === null) {
      return undefined;
    }
    const value = this.head.value;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head.next;
      if (this.head !== null) {
        this.head.prev = null;
      }
    }
    this._size--;
    return value;
  }

  popBack(): T | undefined {
    if (this.tail === null) {
      return undefined;
    }
    const value = this.tail.value;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail.prev;
      if (this.tail !== null) {
        this.tail.next = null;
      }
    }
    this._size--;
    return value;
  }

  peekFront(): T | undefined {
    if (this.head === null) {
      return undefined;
    }
    return this.head.value;
  }

  peekBack(): T | undefined {
    if (this.tail === null) {
      return undefined;
    }
    return this.tail.value;
  }

  get size(): number {
    return this._size;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current !== null) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    const self = this;
    return {
      current: self.head as DequeNode<T> | null,
      next(): IteratorResult<T> {
        if (this.current === null) {
          return { done: true, value: undefined as unknown as T };
        }
        const value = this.current.value;
        this.current = this.current.next;
        return { done: false, value };
      }
    } as Iterator<T> & { current: DequeNode<T> | null };
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  at(index: number): T | undefined {
    if (index === null || index === undefined || typeof index !== 'number' || Number.isNaN(index)) {
      throw new Error('Invalid index: index must be a number');
    }

    // Handle -0 same as 0
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

    // Optimize: traverse from closer end
    if (normalizedIndex <= this._size / 2) {
      let current = this.head;
      for (let i = 0; i < normalizedIndex; i++) {
        current = current!.next;
      }
      return current!.value;
    } else {
      let current = this.tail;
      const stepsFromBack = this._size - 1 - normalizedIndex;
      for (let i = 0; i < stepsFromBack; i++) {
        current = current!.prev;
      }
      return current!.value;
    }
  }
}