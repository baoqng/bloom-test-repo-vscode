// bloom-deps:

type AggregateOp = 'sum' | 'min' | 'max';

export class SegmentTree {
  private readonly _op: AggregateOp;
  private readonly _n: number;
  private readonly _tree: number[];
  private readonly _values: number[];
  private readonly _identity: number;

  constructor(values: number[], op: AggregateOp) {
    if (!Array.isArray(values)) {
      throw new TypeError('values must be an array');
    }
    for (let i = 0; i < values.length; i++) {
      if (typeof values[i] !== 'number' || !isFinite(values[i]) && values[i] !== Infinity && values[i] !== -Infinity) {
        // allow Infinity and -Infinity as valid numeric values
      }
      if (typeof values[i] !== 'number') {
        throw new TypeError(`values[${i}] must be a number`);
      }
    }
    if (op !== 'sum' && op !== 'min' && op !== 'max') {
      throw new TypeError(`op must be 'sum', 'min', or 'max'`);
    }

    this._op = op;
    this._n = values.length;
    this._values = values.slice();

    if (op === 'sum') {
      this._identity = 0;
    } else if (op === 'min') {
      this._identity = Infinity;
    } else {
      this._identity = -Infinity;
    }

    // Build segment tree with size 4*n
    this._tree = new Array(4 * Math.max(this._n, 1)).fill(this._identity);
    if (this._n > 0) {
      this._build(1, 0, this._n - 1);
    }
  }

  private _combine(a: number, b: number): number {
    if (this._op === 'sum') return a + b;
    if (this._op === 'min') return Math.min(a, b);
    return Math.max(a, b);
  }

  private _build(node: number, start: number, end: number): void {
    if (start === end) {
      this._tree[node] = this._values[start];
      return;
    }
    const mid = (start + end) >> 1;
    this._build(2 * node, start, mid);
    this._build(2 * node + 1, mid + 1, end);
    this._tree[node] = this._combine(this._tree[2 * node], this._tree[2 * node + 1]);
  }

  private _update(node: number, start: number, end: number, idx: number, val: number): void {
    if (start === end) {
      this._tree[node] = val;
      return;
    }
    const mid = (start + end) >> 1;
    if (idx <= mid) {
      this._update(2 * node, start, mid, idx, val);
    } else {
      this._update(2 * node + 1, mid + 1, end, idx, val);
    }
    this._tree[node] = this._combine(this._tree[2 * node], this._tree[2 * node + 1]);
  }

  private _query(node: number, start: number, end: number, l: number, r: number): number {
    if (r < start || end < l) {
      return this._identity;
    }
    if (l <= start && end <= r) {
      return this._tree[node];
    }
    const mid = (start + end) >> 1;
    const leftVal = this._query(2 * node, start, mid, l, r);
    const rightVal = this._query(2 * node + 1, mid + 1, end, l, r);
    return this._combine(leftVal, rightVal);
  }

  update(index: number, value: number): void {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }
    if (typeof value !== 'number') {
      throw new TypeError('value must be a number');
    }
    if (this._n === 0 || index < 0 || index >= this._n) {
      throw new RangeError(`index ${index} out of bounds [0, ${this._n - 1}]`);
    }
    this._values[index] = value;
    this._update(1, 0, this._n - 1, index, value);
  }

  query(left: number, right: number): number {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new TypeError('left and right must be numbers');
    }
    if (this._n === 0) {
      throw new RangeError('cannot query an empty tree');
    }
    if (left > right) {
      throw new RangeError('invalid range');
    }
    if (left < 0 || right >= this._n) {
      throw new RangeError(`range [${left}, ${right}] out of bounds [0, ${this._n - 1}]`);
    }
    return this._query(1, 0, this._n - 1, left, right);
  }

  get(index: number): number {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }
    if (this._n === 0 || index < 0 || index >= this._n) {
      throw new RangeError(`index ${index} out of bounds [0, ${this._n - 1}]`);
    }
    return this._values[index];
  }

  get size(): number {
    return this._n;
  }

  toArray(): number[] {
    return this._values.slice();
  }
}