// bloom-deps:

export class CycleError extends Error {
  constructor(message?: string) {
    super(message ?? 'Graph contains a cycle');
    this.name = 'CycleError';
  }
}

interface EdgeEntry<E> {
  data: E | undefined;
}

export class Graph<V, E = void> {
  private readonly _directed: boolean;
  private readonly _vertices: Map<string, V> = new Map();
  private readonly _edges: Map<string, Map<string, EdgeEntry<E>>> = new Map();

  constructor(options?: { directed?: boolean }) {
    this._directed = options?.directed !== false;
  }

  addVertex(id: string, value: V): void {
    if (this._vertices.has(id)) {
      throw new Error(`Vertex '${id}' already exists`);
    }
    this._vertices.set(id, value);
    this._edges.set(id, new Map());
  }

  addEdge(from: string, to: string, data?: E): void {
    if (!this._vertices.has(from)) {
      throw new Error(`Vertex '${from}' does not exist`);
    }
    if (!this._vertices.has(to)) {
      throw new Error(`Vertex '${to}' does not exist`);
    }
    this._edges.get(from)!.set(to, { data });
    if (!this._directed && from !== to) {
      this._edges.get(to)!.set(from, { data });
    }
  }

  removeVertex(id: string): boolean {
    if (!this._vertices.has(id)) {
      return false;
    }
    this._vertices.delete(id);
    this._edges.delete(id);
    for (const adjMap of this._edges.values()) {
      adjMap.delete(id);
    }
    return true;
  }

  removeEdge(from: string, to: string): boolean {
    const adjMap = this._edges.get(from);
    if (!adjMap || !adjMap.has(to)) {
      return false;
    }
    adjMap.delete(to);
    if (!this._directed && from !== to) {
      this._edges.get(to)?.delete(from);
    }
    return true;
  }

  getVertex(id: string): V | undefined {
    return this._vertices.get(id);
  }

  getEdge(from: string, to: string): E | undefined {
    return this._edges.get(from)?.get(to)?.data;
  }

  neighbors(id: string): string[] {
    const adjMap = this._edges.get(id);
    if (!adjMap) return [];
    return Array.from(adjMap.keys());
  }

  bfs(start: string): string[] {
    if (!this._vertices.has(start)) {
      throw new Error(`Vertex '${start}' not found`);
    }
    const visited = new Set<string>();
    const queue: string[] = [start];
    visited.add(start);
    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      for (const neighbor of this._edges.get(current)?.keys() ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }

  dfs(start: string): string[] {
    if (!this._vertices.has(start)) {
      throw new Error(`Vertex '${start}' not found`);
    }
    const visited = new Set<string>();
    const result: string[] = [];
    const stack: string[] = [start];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      result.push(current);
      const neighbors = Array.from(this._edges.get(current)?.keys() ?? []);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        if (!visited.has(neighbors[i])) {
          stack.push(neighbors[i]);
        }
      }
    }
    return result;
  }

  hasCycle(): boolean {
    if (this._directed) {
      return this._hasCycleDirected();
    } else {
      return this._hasCycleUndirected();
    }
  }

  private _hasCycleDirected(): boolean {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    for (const id of this._vertices.keys()) {
      color.set(id, WHITE);
    }

    const dfs = (u: string): boolean => {
      color.set(u, GRAY);
      for (const v of this._edges.get(u)?.keys() ?? []) {
        if (color.get(v) === GRAY) return true;
        if (color.get(v) === WHITE && dfs(v)) return true;
      }
      color.set(u, BLACK);
      return false;
    };

    for (const id of this._vertices.keys()) {
      if (color.get(id) === WHITE) {
        if (dfs(id)) return true;
      }
    }
    return false;
  }

  private _hasCycleUndirected(): boolean {
    const visited = new Set<string>();

    const dfs = (u: string, parent: string | null): boolean => {
      visited.add(u);
      for (const v of this._edges.get(u)?.keys() ?? []) {
        if (v === u) return true; // self-loop
        if (!visited.has(v)) {
          if (dfs(v, u)) return true;
        } else if (v !== parent) {
          return true;
        }
      }
      return false;
    };

    for (const id of this._vertices.keys()) {
      if (!visited.has(id)) {
        if (dfs(id, null)) return true;
      }
    }
    return false;
  }

  topologicalSort(): string[] {
    if (!this._directed || this.hasCycle()) {
      throw new CycleError('Topological sort requires a directed acyclic graph');
    }

    const inDegree = new Map<string, number>();
    for (const id of this._vertices.keys()) {
      inDegree.set(id, 0);
    }

    for (const [, adjMap] of this._edges) {
      for (const to of adjMap.keys()) {
        inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      result.push(u);
      for (const v of this._edges.get(u)?.keys() ?? []) {
        const newDeg = (inDegree.get(v) ?? 0) - 1;
        inDegree.set(v, newDeg);
        if (newDeg === 0) queue.push(v);
      }
    }

    return result;
  }

  shortestPath(from: string, to: string): string[] | null {
    if (!this._vertices.has(from) || !this._vertices.has(to)) {
      return null;
    }
    if (from === to) {
      return [from];
    }

    const visited = new Set<string>();
    const parent = new Map<string, string | null>();
    const queue: string[] = [from];
    visited.add(from);
    parent.set(from, null);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this._edges.get(current)?.keys() ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          if (neighbor === to) {
            const path: string[] = [];
            let node: string | null = to;
            while (node !== null) {
              path.unshift(node);
              node = parent.get(node) ?? null;
            }
            return path;
          }
          queue.push(neighbor);
        }
      }
    }

    return null;
  }

  get vertexCount(): number {
    return this._vertices.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const adjMap of this._edges.values()) {
      count += adjMap.size;
    }
    if (!this._directed) {
      count = Math.ceil(count / 2);
    }
    return count;
  }
}