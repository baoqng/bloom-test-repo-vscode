// bloom-deps:

export class MultiMap<K, V> {
  private _map: Map<K, V[]> = new Map();

  set(key: K, value: V): this {
    if (!this._map.has(key)) {
      this._map.set(key, []);
    }
    this._map.get(key)!.push(value);
    return this;
  }

  get(key: K): V[] {
    return this._map.get(key) ?? [];
  }

  has(key: K): boolean {
    const vals = this._map.get(key);
    return vals !== undefined && vals.length > 0;
  }

  hasEntry(key: K, value: V): boolean {
    const vals = this._map.get(key);
    if (!vals) return false;
    return vals.includes(value);
  }

  delete(key: K): boolean {
    return this._map.delete(key);
  }

  deleteEntry(key: K, value: V): boolean {
    const vals = this._map.get(key);
    if (!vals) return false;
    const idx = vals.indexOf(value);
    if (idx === -1) return false;
    vals.splice(idx, 1);
    if (vals.length === 0) {
      this._map.delete(key);
    }
    return true;
  }

  keys(): K[] {
    return Array.from(this._map.keys());
  }

  values(): V[] {
    const result: V[] = [];
    for (const vals of this._map.values()) {
      for (const v of vals) {
        result.push(v);
      }
    }
    return result;
  }

  entries(): [K, V[]][] {
    return Array.from(this._map.entries());
  }

  flatEntries(): [K, V][] {
    const result: [K, V][] = [];
    for (const [key, vals] of this._map.entries()) {
      for (const v of vals) {
        result.push([key, v]);
      }
    }
    return result;
  }

  get size(): number {
    return this._map.size;
  }

  get totalSize(): number {
    let count = 0;
    for (const vals of this._map.values()) {
      count += vals.length;
    }
    return count;
  }

  merge(other: MultiMap<K, V>): MultiMap<K, V> {
    const result = new MultiMap<K, V>();
    for (const [key, vals] of this._map.entries()) {
      for (const v of vals) {
        result.set(key, v);
      }
    }
    for (const [key, vals] of other._map.entries()) {
      for (const v of vals) {
        result.set(key, v);
      }
    }
    return result;
  }

  clear(): void {
    this._map.clear();
  }
}