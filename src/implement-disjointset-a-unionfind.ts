// bloom-deps:

export class DisjointSet {
  private parent: number[];
  private rank: number[];
  private size: number[];
  private componentCountValue: number;

  constructor(size: number) {
    if (size < 1) {
      throw new RangeError(`DisjointSet size must be at least 1, got ${size}`);
    }

    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = Array(size).fill(0);
    this.size = Array(size).fill(1);
    this.componentCountValue = size;
  }

  find(x: number): number {
    if (x < 0 || x >= this.parent.length) {
      throw new RangeError(`Element ${x} out of bounds [0, ${this.parent.length - 1}]`);
    }

    // Path compression using iterative approach
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    // Already in the same component
    if (rootX === rootY) {
      return false;
    }

    // Union by rank: attach smaller rank tree under larger rank tree
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
      this.size[rootY] += this.size[rootX];
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
      this.size[rootX] += this.size[rootY];
    } else {
      // Equal rank: either can be root, but increment new root's rank
      this.parent[rootY] = rootX;
      this.size[rootX] += this.size[rootY];
      this.rank[rootX]++;
    }

    this.componentCountValue--;
    return true;
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  componentSize(x: number): number {
    const root = this.find(x);
    return this.size[root];
  }

  get componentCount(): number {
    return this.componentCountValue;
  }

  roots(): number[] {
    const rootSet = new Set<number>();
    for (let i = 0; i < this.parent.length; i++) {
      rootSet.add(this.find(i));
    }
    return Array.from(rootSet).sort((a, b) => a - b);
  }
}