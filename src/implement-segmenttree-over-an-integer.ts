// bloom-deps:

type AggregateOp = 'sum' | 'min' | 'max';

export class SegmentTree {
  private tree: number[];
  private size: number;
  private op: AggregateOp;

  constructor(values: number[], op: AggregateOp) {
    if (!Array.isArray(values)) {
      throw new TypeError('values must be an array');
    }

    this.op = op;
    this.size = values.length;

    if (this.size === 0) {
      this.tree = [];
      return;
    }

    // Validate all input values are numeric
    for (let i = 0; i < values.length; i++) {
      if (typeof values[i] !== 'number' || !Number.isFinite(values[i])) {
        throw new TypeError(`Invalid input at index ${i}: expected finite number`);
      }
    }

    // Build tree with capacity for heap structure
    const treeSize = 4 * this.size;
    this.tree = new Array(treeSize).fill(this.getIdentity());

    this.buildTree(values, 0, 0, this.size - 1);
  }

  private getIdentity(): number {
    switch (this.op) {
      case 'sum':
        return 0;
      case 'min':
        return Infinity;
      case 'max':
        return -Infinity;
    }
  }

  private aggregate(a: number, b: number): number {
    switch (this.op) {
      case 'sum':
        return a + b;
      case 'min':
        return Math.min(a, b);
      case 'max':
        return Math.max(a, b);
    }
  }

  private buildTree(
    values: number[],
    nodeIdx: number,
    start: number,
    end: number
  ): void {
    if (start === end) {
      this.tree[nodeIdx] = values[start];
      return;
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * nodeIdx + 1;
    const rightChild = 2 * nodeIdx + 2;

    this.buildTree(values, leftChild, start, mid);
    this.buildTree(values, rightChild, mid + 1, end);

    this.tree[nodeIdx] = this.aggregate(
      this.tree[leftChild],
      this.tree[rightChild]
    );
  }

  private updateHelper(
    nodeIdx: number,
    start: number,
    end: number,
    index: number,
    value: number
  ): void {
    if (start === end) {
      this.tree[nodeIdx] = value;
      return;
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * nodeIdx + 1;
    const rightChild = 2 * nodeIdx + 2;

    if (index <= mid) {
      this.updateHelper(leftChild, start, mid, index, value);
    } else {
      this.updateHelper(rightChild, mid + 1, end, index, value);
    }

    this.tree[nodeIdx] = this.aggregate(
      this.tree[leftChild],
      this.tree[rightChild]
    );
  }

  private queryHelper(
    nodeIdx: number,
    start: number,
    end: number,
    left: number,
    right: number
  ): number {
    if (right < start || left > end) {
      return this.getIdentity();
    }

    if (left <= start && end <= right) {
      return this.tree[nodeIdx];
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * nodeIdx + 1;
    const rightChild = 2 * nodeIdx + 2;

    const leftResult = this.queryHelper(leftChild, start, mid, left, right);
    const rightResult = this.queryHelper(rightChild, mid + 1, end, left, right);

    return this.aggregate(leftResult, rightResult);
  }

  update(index: number, value: number): void {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('value must be a finite number');
    }

    if (index < 0 || index >= this.size) {
      throw new RangeError(
        `index out of bounds: ${index} not in [0, ${this.size - 1}]`
      );
    }

    this.updateHelper(0, 0, this.size - 1, index, value);
  }

  query(left: number, right: number): number {
    if (typeof left !== 'number' || !Number.isInteger(left)) {
      throw new TypeError('left must be an integer');
    }

    if (typeof right !== 'number' || !Number.isInteger(right)) {
      throw new TypeError('right must be an integer');
    }

    if (this.size === 0) {
      throw new RangeError('cannot query empty segment tree');
    }

    if (left > right) {
      throw new RangeError('invalid range');
    }

    if (left < 0 || right >= this.size) {
      throw new RangeError(
        `bounds out of range: [${left}, ${right}] not in [0, ${this.size - 1}]`
      );
    }

    return this.queryHelper(0, 0, this.size - 1, left, right);
  }

  get(index: number): number {
    if (typeof index !== 'number' || !Number.isInteger(index)) {
      throw new TypeError('index must be an integer');
    }

    if (index < 0 || index >= this.size) {
      throw new RangeError(
        `index out of bounds: ${index} not in [0, ${this.size - 1}]`
      );
    }

    return this.query(index, index);
  }

  get length(): number {
    return this.size;
  }

  toArray(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.get(i));
    }
    return result;
  }
}