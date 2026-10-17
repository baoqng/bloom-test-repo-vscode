// bloom-deps:

export class MinHeap<T> {
  private _heap: T[] = [];
  private _comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    if (comparator !== undefined && typeof comparator !== 'function') {
      throw new TypeError('comparator must be a function');
    }
    this._comparator = comparator ?? ((a, b) => a < b ? -1 : a > b ? 1 : 0);
  }

  get size(): number {
    return this._heap.length;
  }

  get isEmpty(): boolean {
    return this._heap.length === 0;
  }

  push(item: T): void {
    this._heap.push(item);
    this._bubbleUp(this._heap.length - 1);
  }

  pop(): T | undefined {
    if (this._heap.length === 0) {
      return undefined;
    }
    const min = this._heap[0];
    const last = this._heap.pop()!;
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._siftDown(0);
    }
    return min;
  }

  peek(): T | undefined {
    if (this._heap.length === 0) {
      return undefined;
    }
    return this._heap[0];
  }

  toSortedArray(): T[] {
    const copy = new MinHeap<T>(this._comparator);
    copy._heap = [...this._heap];
    const result: T[] = [];
    while (!copy.isEmpty) {
      result.push(copy.pop()!);
    }
    return result;
  }

  has(item: T): boolean {
    for (const existing of this._heap) {
      if (this._comparator(existing, item) === 0) {
        return true;
      }
    }
    return false;
  }

  pushAll(items: T[]): void {
    if (!Array.isArray(items)) {
      throw new TypeError('items must be an array');
    }
    if (items.length === 0) {
      return;
    }
    for (const item of items) {
      this._heap.push(item);
    }
    // Heapify: start from last non-leaf and sift down
    const start = Math.floor(this._heap.length / 2) - 1;
    for (let i = start; i >= 0; i--) {
      this._siftDown(i);
    }
  }

  private _bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this._comparator(this._heap[index], this._heap[parentIndex]) < 0) {
        const tmp = this._heap[parentIndex];
        this._heap[parentIndex] = this._heap[index];
        this._heap[index] = tmp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private _siftDown(index: number): void {
    const length = this._heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this._comparator(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this._comparator(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        const tmp = this._heap[smallest];
        this._heap[smallest] = this._heap[index];
        this._heap[index] = tmp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}