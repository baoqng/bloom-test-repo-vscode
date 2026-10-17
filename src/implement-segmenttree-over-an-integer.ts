// bloom-deps:

export type AggregateOp = 'sum' | 'min' | 'max';

export class SegmentTree {
  private readonly _size: number;
  private readonly _op: AggregateOp;
  private readonly _identity: number;
  private readonly _tree: number[];
  private readonly _values: number[];

  constructor(values: number[], op: AggregateOp) {
    if (!Array.isArray(values)) {
      throw new TypeError('values must be an array');
    }
    if (op !== 'sum' && op !== 'min' && op !== 'max') {
      throw new TypeError('op must be one of: sum, min, max');
    }

    this._size = values.length;
    this._op = op;
    this._identity = op === 'sum' ? 0 : op === 'min' ? Infinity : -Infinity;
    this._values = values.slice();
    this._tree = new Array(4 * Math.max(this._size, 1)).fill(this._identity);

    if (this._size > 0) {
      this._build(1, 0, this._size - 1);
    }
  }

  private _combine(a: number, b: number): number {
    switch (this._op) {
      case 'sum': return a + b;
      case 'min': return Math.min(a, b);
      case 'max': return Math.max(a, b);
    }
  }

  private _build(node: number, start: number, end: number): void {
    if (start === end) {
      const v = this._values[start];
      if (typeof v !== 'number' || !isFinite(v) && isNaN(v)) {
        this._tree[node] = this._identity;
      } else {
        this._tree[node] = v;
      }
      return;
    }
    const mid = (start + end) >> 1;
    this._build(2 * node, start, mid);
    this._build(2 * node + 1, mid + 1, end);
    this._tree[node] = this._combine(this._tree[2 * node], this._tree[2 * node + 1]);
  }

  private _update(node: number, start: number, end: number, idx: number, value: number): void {
    if (start === end) {
      this._tree[node] = value;
      this._values[idx] = value;
      return;
    }
    const mid = (start + end) >> 1;
    if (idx <= mid) {
      this._update(2 * node, start, mid, idx, value);
    } else {
      this._update(2 * node + 1, mid + 1, end, idx, value);
    }
    this._tree[node] = this._combine(this._tree[2 * node], this._tree[2 * node + 1]);
  }

  private _query(node: number, start: number, end: number, left: number, right: number): number {
    if (right < start || end < left) {
      return this._identity;
    }
    if (left <= start && end <= right) {
      return this._tree[node];
    }
    const mid = (start + end) >> 1;
    const leftVal = this._query(2 * node, start, mid, left, right);
    const rightVal = this._query(2 * node + 1, mid + 1, end, left, right);
    return this._combine(leftVal, rightVal);
  }

  get size(): number {
    return this._size;
  }

  update(index: number, value: number): void {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }
    if (typeof value !== 'number') {
      throw new TypeError('value must be a number');
    }
    if (this._size === 0 || index < 0 || index >= this._size) {
      throw new RangeError(`index ${index} out of bounds [0, ${this._size - 1}]`);
    }
    this._update(1, 0, this._size - 1, index, value);
  }

  query(left: number, right: number): number {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new TypeError('left and right must be numbers');
    }
    if (this._size === 0) {
      throw new RangeError('cannot query an empty tree');
    }
    if (!Number.isInteger(left) || !Number.isInteger(right)) {
      throw new RangeError('left and right must be integers');
    }
    if (left > right) {
      throw new RangeError('invalid range');
    }
    if (left < 0 || right >= this._size) {
      throw new RangeError(`range [${left}, ${right}] out of bounds [0, ${this._size - 1}]`);
    }
    return this._query(1, 0, this._size - 1, left, right);
  }

  get(index: number): number {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }
    if (this._size === 0 || index < 0 || index >= this._size) {
      throw new RangeError(`index ${index} out of bounds [0, ${this._size - 1}]`);
    }
    return this._values[index];
  }

  toArray(): number[] {
    return this._values.slice();
  }
}