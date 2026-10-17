// bloom-deps:

export class FenwickTree {
  private readonly tree: number[];
  private readonly n: number;

  constructor(arg: number | number[]) {
    if (Array.isArray(arg)) {
      const values = arg;
      for (let idx = 0; idx < values.length; idx++) {
        if (typeof values[idx] !== 'number' || !isFinite(values[idx])) {
          throw new TypeError(
            `Element at index ${idx} is not a finite number`
          );
        }
      }
      this.n = values.length;
      if (this.n < 1) {
        throw new RangeError('Array must have at least one element');
      }
      this.tree = new Array(this.n + 1).fill(0);
      // O(n) build
      for (let i = 1; i <= this.n; i++) {
        this.tree[i] += values[i - 1];
        const parent = i + (i & -i);
        if (parent <= this.n) {
          this.tree[parent] += this.tree[i];
        }
      }
    } else {
      if (typeof arg !== 'number') {
        throw new TypeError('Argument must be a number or array');
      }
      const n = arg;
      if (
        !Number.isInteger(n) ||
        n < 1
      ) {
        throw new RangeError(
          'n must be a positive integer >= 1'
        );
      }
      this.n = n;
      this.tree = new Array(this.n + 1).fill(0);
    }
  }

  get size(): number {
    return this.n;
  }

  update(i: number, delta: number): void {
    if (i < 1 || i > this.n) {
      throw new RangeError(
        `Index i=${i} is out of bounds [1, ${this.n}]`
      );
    }
    let idx = i;
    while (idx <= this.n) {
      this.tree[idx] += delta;
      idx += idx & -idx;
    }
  }

  prefixSum(i: number): number {
    if (i < 0 || i > this.n) {
      throw new RangeError(
        `Index i=${i} is out of bounds [0, ${this.n}]`
      );
    }
    if (i === 0) {
      return 0;
    }
    let sum = 0;
    let idx = i;
    while (idx > 0) {
      sum += this.tree[idx];
      idx -= idx & -idx;
    }
    return sum;
  }

  rangeSum(l: number, r: number): number {
    if (l < 1) {
      throw new RangeError(`l=${l} must be >= 1`);
    }
    if (r > this.n) {
      throw new RangeError(`r=${r} must be <= n=${this.n}`);
    }
    if (l > r) {
      throw new RangeError(`l=${l} must be <= r=${r}`);
    }
    return this.prefixSum(r) - this.prefixSum(l - 1);
  }
}