// bloom-deps:

export class CycleError extends Error {
  constructor(message?: string) {
    super(message ?? 'Graph contains a cycle');
    this.name = 'CycleError';
  }
}

interface VertexEntry<V> {
  value: V;
}

interface EdgeEntry<E> {
  data: E | undefined;
}

export class Graph<V, E = void> {
  private readonly _directed: boolean;
  private readonly _vertices: Map<string, VertexEntry<V>>;
  // _edges[from][to] = EdgeEntry
  private readonly _edges: Map<string, Map<string, EdgeEntry<E>>>;

  constructor(options?: { directed?: boolean }) {
    this._directed = options?.directed !== false;
    this._vertices = new Map();
    this._edges = new Map();
  }

  addVertex(id: string, value: V): void {
    if (this._vertices.has(id)) {
      throw new Error(`Vertex '${id}' already exists`);
    }
    this._vertices.set(id, { value });
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
    // Remove all edges pointing to this vertex
    for (const [, adj] of this._edges) {
      adj.delete(id);
    }
    return true;
  }

  removeEdge(from: string, to: string): boolean {
    const adj = this._edges.get(from);
    if (!adj || !adj.has(to)) {
      return false;
    }
    adj.delete(to);
    if (!this._directed && from !== to) {
      this._edges.get(to)?.delete(from);
    }
    return true;
  }

  getVertex(id: string): V | undefined {
    return this._vertices.get(id)?.value;
  }

  getEdge(from: string, to: string): E | undefined {
    return this._edges.get(from)?.get(to)?.data;
  }

  neighbors(id: string): string[] {
    const adj = this._edges.get(id);
    if (!adj) return [];
    return Array.from(adj.keys());
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
      const adj = this._edges.get(current);
      if (adj) {
        for (const neighbor of adj.keys()) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
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
      const adj = this._edges.get(current);
      if (adj) {
        // Push in reverse order so we visit in insertion order
        const neighbors = Array.from(adj.keys());
        for (let i = neighbors.length - 1; i >= 0; i--) {
          if (!visited.has(neighbors[i])) {
            stack.push(neighbors[i]);
          }
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
    // DFS with coloring: 0=white, 1=gray, 2=black
    const color = new Map<string, number>();
    for (const id of this._vertices.keys()) {
      color.set(id, 0);
    }

    const dfsVisit = (u: string): boolean => {
      color.set(u, 1);
      const adj = this._edges.get(u);
      if (adj) {
        for (const v of adj.keys()) {
          if (color.get(v) === 1) {
            // Self-loop or back edge
            return true;
          }
          if (color.get(v) === 0 && dfsVisit(v)) {
            return true;
          }
        }
      }
      color.set(u, 2);
      return false;
    };

    for (const id of this._vertices.keys()) {
      if (color.get(id) === 0) {
        if (dfsVisit(id)) return true;
      }
    }
    return false;
  }

  private _hasCycleUndirected(): boolean {
    // Union-Find approach
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();

    for (const id of this._vertices.keys()) {
      parent.set(id, id);
      rank.set(id, 0);
    }

    const find = (x: string): string => {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    };

    const union = (x: string, y: string): boolean => {
      const rx = find(x);
      const ry = find(y);
      if (rx === ry) return false; // cycle
      const rankX = rank.get(rx)!;
      const rankY = rank.get(ry)!;
      if (rankX < rankY) {
        parent.set(rx, ry);
      } else if (rankX > rankY) {
        parent.set(ry, rx);
      } else {
        parent.set(ry, rx);
        rank.set(rx, rankX + 1);
      }
      return true;
    };

    // Track visited edges to avoid double-counting undirected edges
    const visitedEdges = new Set<string>();

    for (const [from, adj] of this._edges) {
      for (const to of adj.keys()) {
        // Self-loop always a cycle
        if (from === to) return true;

        // Canonical edge key for undirected
        const edgeKey = from < to ? `${from}|${to}` : `${to}|${from}`;
        if (visitedEdges.has(edgeKey)) continue;
        visitedEdges.add(edgeKey);

        if (!union(from, to)) {
          return true;
        }
      }
    }
    return false;
  }

  topologicalSort(): string[] {
    if (this.hasCycle()) {
      throw new CycleError();
    }

    // Kahn\u2019s algorithm
    const inDegree = new Map<string, number>();
    for (const id of this._vertices.keys()) {
      inDegree.set(id, 0);
    }

    for (const [, adj] of this._edges) {
      for (const to of adj.keys()) {
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
      const adj = this._edges.get(u);
      if (adj) {
        for (const v of adj.keys()) {
          const newDeg = (inDegree.get(v) ?? 0) - 1;
          inDegree.set(v, newDeg);
          if (newDeg === 0) queue.push(v);
        }
      }
    }

    if (result.length !== this._vertices.size) {
      throw new CycleError();
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

    const prev = new Map<string, string>();
    const visited = new Set<string>();
    const queue: string[] = [from];
    visited.add(from);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const adj = this._edges.get(current);
      if (adj) {
        for (const neighbor of adj.keys()) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            prev.set(neighbor, current);
            if (neighbor === to) {
              // Reconstruct path
              const path: string[] = [];
              let node: string | undefined = to;
              while (node !== undefined) {
                path.unshift(node);
                node = prev.get(node);
              }
              return path;
            }
            queue.push(neighbor);
          }
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
    for (const [, adj] of this._edges) {
      count += adj.size;
    }
    if (!this._directed) {
      // Each undirected edge is stored twice (except self-loops)
      // Count self-loops separately
      let selfLoops = 0;
      for (const [from, adj] of this._edges) {
        if (adj.has(from)) selfLoops++;
      }
      count = (count - selfLoops) / 2 + selfLoops;
    }
    return count;
  }
}