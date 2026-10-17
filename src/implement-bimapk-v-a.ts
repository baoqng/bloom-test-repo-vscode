// bloom-deps:

export class BiMap<K, V> {
  private readonly _m1 = new Map<K, V>();
  private readonly _m2 = new Map<V, K>();

  constructor(entries?: readonly (readonly [K, V])[]) {
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  set(key: K, value: V): this {
    if (key === undefined || key === null) {
      throw new TypeError('key must not be undefined');
    }
    if (value === undefined) {
      throw new TypeError('value must not be undefined');
    }

    // If key already exists, remove its old value from _m2
    const previousValue = this._m1.get(key);
    if (previousValue !== undefined) {
      this._m2.delete(previousValue);
    }

    // If value already exists, remove its old key from _m1
    const previousKey = this._m2.get(value);
    if (previousKey !== undefined) {
      this._m1.delete(previousKey);
    }

    this._m1.set(key, value);
    this._m2.set(value, key);

    return this;
  }

  get(key: K): V | undefined {
    return this._m1.get(key);
  }

  getKey(value: V): K | undefined {
    return this._m2.get(value);
  }

  delete(key: K): boolean {
    const value = this._m1.get(key);
    if (value === undefined) {
      return false;
    }
    this._m1.delete(key);
    this._m2.delete(value);
    return true;
  }

  deleteValue(value: V): boolean {
    const key = this._m2.get(value);
    if (key === undefined) {
      return false;
    }
    this._m2.delete(value);
    this._m1.delete(key);
    return true;
  }

  has(key: K): boolean {
    return this._m1.has(key);
  }

  hasValue(value: V): boolean {
    return this._m2.has(value);
  }

  get size(): number {
    return this._m1.size;
  }

  keys(): IterableIterator<K> {
    return this._m1.keys();
  }

  values(): IterableIterator<V> {
    return this._m1.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this._m1.entries();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._m1.entries();
  }

  clear(): void {
    this._m1.clear();
    this._m2.clear();
  }
}