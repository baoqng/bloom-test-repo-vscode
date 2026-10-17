// bloom-deps:

export class SortedList<T> {
  private _items: T[];
  private _comparator: (a: T, b: T) => number;

  constructor(
    comparator?: (a: T, b: T) => number,
    items?: T[]
  ) {
    if (comparator !== undefined && typeof comparator !== 'function') {
      throw new TypeError('comparator must be a function');
    }
    this._comparator = comparator ?? ((a, b) => a < b ? -1 : a > b ? 1 : 0);
    this._items = [];
    if (items && items.length > 0) {
      for (const item of items) {
        this._insertSorted(item);
      }
    }
  }

  private _binarySearchLeft(item: T): number {
    let lo = 0;
    let hi = this._items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this._comparator(this._items[mid], item) < 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  private _binarySearchRight(item: T): number {
    let lo = 0;
    let hi = this._items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this._comparator(this._items[mid], item) <= 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  private _insertSorted(item: T): void {
    const pos = this._binarySearchRight(item);
    this._items.splice(pos, 0, item);
  }

  add(item: T): void {
    this._insertSorted(item);
  }

  remove(item: T): boolean {
    const idx = this.indexOf(item);
    if (idx === -1) {
      return false;
    }
    this._items.splice(idx, 1);
    return true;
  }

  has(item: T): boolean {
    const idx = this._binarySearchLeft(item);
    return idx < this._items.length && this._comparator(this._items[idx], item) === 0;
  }

  indexOf(item: T): number {
    const idx = this._binarySearchLeft(item);
    if (idx < this._items.length && this._comparator(this._items[idx], item) === 0) {
      return idx;
    }
    return -1;
  }

  at(index: number): T | undefined {
    const size = this._items.length;
    if (size === 0) return undefined;
    let normalizedIndex = index;
    if (normalizedIndex < 0) {
      normalizedIndex = size + normalizedIndex;
    }
    if (normalizedIndex < 0 || normalizedIndex >= size) {
      return undefined;
    }
    return this._items[normalizedIndex];
  }

  slice(start?: number, end?: number): T[] {
    return this._items.slice(start, end);
  }

  get size(): number {
    return this._items.length;
  }

  toArray(): T[] {
    return [...this._items];
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this._items;
    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined as unknown as T, done: true };
      }
    };
  }

  rangeQuery(lo: T, hi: T, inclusive?: { lo?: boolean; hi?: boolean }): T[] {
    const loInclusive = inclusive?.lo !== false;
    const hiInclusive = inclusive?.hi !== false;

    if (this._comparator(lo, hi) > 0) {
      return [];
    }

    let startIdx: number;
    if (loInclusive) {
      startIdx = this._binarySearchLeft(lo);
    } else {
      startIdx = this._binarySearchRight(lo);
    }

    let endIdx: number;
    if (hiInclusive) {
      endIdx = this._binarySearchRight(hi);
    } else {
      endIdx = this._binarySearchLeft(hi);
    }

    return this._items.slice(startIdx, endIdx);
  }

  addAll(items: T[]): void {
    if (!Array.isArray(items)) {
      throw new TypeError('items must be an array');
    }
    for (const item of items) {
      this._insertSorted(item);
    }
  }
}