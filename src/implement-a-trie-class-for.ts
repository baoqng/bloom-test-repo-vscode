// bloom-deps:

export class Trie {
  private root: TrieNode = new TrieNode();
  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  insert(word: string): void {
    if (typeof word !== 'string' || word.length === 0) {
      throw new TypeError('word must be a non-empty string');
    }
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch)!;
    }
    if (!node.isEnd) {
      node.isEnd = true;
      this._size++;
    }
  }

  search(word: string): boolean {
    if (typeof word !== 'string' || word.length === 0) {
      throw new TypeError('word must be a non-empty string');
    }
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        return false;
      }
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new TypeError('prefix must be a non-empty string');
    }
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) {
        return false;
      }
      node = node.children.get(ch)!;
    }
    return true;
  }

  delete(word: string): boolean {
    if (typeof word !== 'string' || word.length === 0) {
      throw new TypeError('word must be a non-empty string');
    }
    // First check existence
    if (!this.search(word)) {
      return false;
    }
    // Recursively delete and prune
    this._delete(this.root, word, 0);
    this._size--;
    return true;
  }

  private _delete(node: TrieNode, word: string, depth: number): boolean {
    if (depth === word.length) {
      node.isEnd = false;
      // Prune if no children
      return node.children.size === 0;
    }
    const ch = word[depth];
    const child = node.children.get(ch);
    if (!child) {
      return false;
    }
    const shouldDeleteChild = this._delete(child, word, depth + 1);
    if (shouldDeleteChild) {
      node.children.delete(ch);
      // Prune current node if it has no children and is not end of another word
      return node.children.size === 0 && !node.isEnd;
    }
    return false;
  }

  listAll(): string[] {
    const results: string[] = [];
    this._collect(this.root, '', results);
    return results;
  }

  private _collect(node: TrieNode, prefix: string, results: string[]): void {
    if (node.isEnd) {
      results.push(prefix);
    }
    // Iterate children in sorted order for lexicographic output
    const sortedKeys = Array.from(node.children.keys()).sort();
    for (const ch of sortedKeys) {
      this._collect(node.children.get(ch)!, prefix + ch, results);
    }
  }
}

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd: boolean = false;
}