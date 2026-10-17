// bloom-deps:

export interface Interval<T> {
  low: number;
  high: number;
  data: T;
}

interface TreeNode<T> {
  interval: Interval<T>;
  maxHigh: number;
  left: TreeNode<T> | null;
  right: TreeNode<T> | null;
  insertionIndex: number;
}

export class IntervalTree<T> {
  private root: TreeNode<T> | null = null;
  private _size = 0;
  private _insertionCounter = 0;

  get size(): number {
    return this._size;
  }

  insert(interval: Interval<T>): void {
    if (interval.low > interval.high) {
      throw new RangeError(
        `Invalid interval: low (${interval.low}) must be <= high (${interval.high})`
      );
    }
    const node: TreeNode<T> = {
      interval,
      maxHigh: interval.high,
      left: null,
      right: null,
      insertionIndex: this._insertionCounter++,
    };
    this.root = this._insert(this.root, node);
    this._size++;
  }

  private _insert(root: TreeNode<T> | null, node: TreeNode<T>): TreeNode<T> {
    if (root === null) {
      return node;
    }
    if (node.interval.low < root.interval.low ||
        (node.interval.low === root.interval.low && node.insertionIndex < root.insertionIndex)) {
      root.left = this._insert(root.left, node);
    } else {
      root.right = this._insert(root.right, node);
    }
    if (node.interval.high > root.maxHigh) {
      root.maxHigh = node.interval.high;
    }
    return root;
  }

  remove(interval: Interval<T>): boolean {
    let found = false;
    this.root = this._remove(this.root, interval, (wasFound) => {
      found = wasFound;
    });
    if (found) {
      this._size--;
    }
    return found;
  }

  private _remove(
    root: TreeNode<T> | null,
    interval: Interval<T>,
    callback: (found: boolean) => void
  ): TreeNode<T> | null {
    if (root === null) {
      callback(false);
      return null;
    }

    // We need to search the whole tree for the first insertion-order match
    // Try left first (lower insertion indices tend to be there for equal keys)
    let found = false;

    // Check if current node matches
    const matches =
      root.interval.low === interval.low &&
      root.interval.high === interval.high &&
      root.interval.data === interval.data;

    if (matches) {
      found = true;
      callback(true);
      // Remove this node
      const replacement = this._deleteNode(root);
      return replacement;
    }

    // Search left subtree first
    let leftFound = false;
    root.left = this._remove(root.left, interval, (f) => { leftFound = f; });
    if (leftFound) {
      callback(true);
      root.maxHigh = this._computeMaxHigh(root);
      return root;
    }

    // Search right subtree
    let rightFound = false;
    root.right = this._remove(root.right, interval, (f) => { rightFound = f; });
    if (rightFound) {
      callback(true);
      root.maxHigh = this._computeMaxHigh(root);
      return root;
    }

    callback(false);
    return root;
  }

  private _deleteNode(node: TreeNode<T>): TreeNode<T> | null {
    if (node.left === null && node.right === null) {
      return null;
    }
    if (node.left === null) {
      return node.right;
    }
    if (node.right === null) {
      return node.left;
    }
    // Find in-order successor (leftmost node in right subtree)
    let successorParent: TreeNode<T> = node;
    let successor: TreeNode<T> = node.right;
    while (successor.left !== null) {
      successorParent = successor;
      successor = successor.left;
    }
    // Replace node's data with successor's data
    node.interval = successor.interval;
    node.insertionIndex = successor.insertionIndex;
    // Remove successor
    if (successorParent === node) {
      successorParent.right = successor.right;
    } else {
      successorParent.left = successor.right;
    }
    node.maxHigh = this._computeMaxHigh(node);
    return node;
  }

  private _computeMaxHigh(node: TreeNode<T>): number {
    let max = node.interval.high;
    if (node.left !== null && node.left.maxHigh > max) {
      max = node.left.maxHigh;
    }
    if (node.right !== null && node.right.maxHigh > max) {
      max = node.right.maxHigh;
    }
    return max;
  }

  overlaps(low: number, high: number): Interval<T>[] {
    const results: Array<{ interval: Interval<T>; insertionIndex: number }> = [];
    this._overlaps(this.root, low, high, results);
    results.sort((a, b) => a.insertionIndex - b.insertionIndex);
    return results.map((r) => r.interval);
  }

  private _overlaps(
    node: TreeNode<T> | null,
    low: number,
    high: number,
    results: Array<{ interval: Interval<T>; insertionIndex: number }>
  ): void {
    if (node === null) {
      return;
    }
    // If maxHigh of this subtree is less than low, no interval in this subtree can overlap
    if (node.maxHigh < low) {
      return;
    }
    // Search left subtree
    this._overlaps(node.left, low, high, results);
    // Check current node
    if (node.interval.low <= high && node.interval.high >= low) {
      results.push({ interval: node.interval, insertionIndex: node.insertionIndex });
    }
    // If current node's low > high, no need to search right subtree
    if (node.interval.low > high) {
      return;
    }
    // Search right subtree
    this._overlaps(node.right, low, high, results);
  }

  stabbing(point: number): Interval<T>[] {
    return this.overlaps(point, point);
  }

  clear(): void {
    this.root = null;
    this._size = 0;
  }
}