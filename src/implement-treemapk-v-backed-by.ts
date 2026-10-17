// bloom-deps:

class TreeNode<K, V> {
	key: K;
	value: V;
	left: TreeNode<K, V> | null = null;
	right: TreeNode<K, V> | null = null;
	height: number = 1;

	constructor(key: K, value: V) {
		this.key = key;
		this.value = value;
	}
}

export class TreeMap<K, V> {
	private root: TreeNode<K, V> | null = null;
	private _size: number = 0;
	private comparator: (a: K, b: K) => number;

	constructor(comparator: (a: K, b: K) => number) {
		this.comparator = comparator;
	}

	set(key: K, value: V): this {
		const existing = this.findNode(this.root, key);
		if (existing !== null) {
			existing.value = value;
		} else {
			this.root = this.insertNode(this.root, key, value);
			this._size++;
		}
		return this;
	}

	get(key: K): V | undefined {
		const node = this.findNode(this.root, key);
		return node ? node.value : undefined;
	}

	has(key: K): boolean {
		return this.findNode(this.root, key) !== null;
	}

	delete(key: K): boolean {
		const hadNode = this.findNode(this.root, key) !== null;
		if (hadNode) {
			this.root = this.deleteNode(this.root, key);
			this._size--;
		}
		return hadNode;
	}

	get size(): number {
		return this._size;
	}

	clear(): void {
		this.root = null;
		this._size = 0;
	}

	keys(): K[] {
		const result: K[] = [];
		this.inorderTraverse(this.root, (node) => {
			result.push(node.key);
		});
		return result;
	}

	values(): V[] {
		const result: V[] = [];
		this.inorderTraverse(this.root, (node) => {
			result.push(node.value);
		});
		return result;
	}

	entries(): [K, V][] {
		const result: [K, V][] = [];
		this.inorderTraverse(this.root, (node) => {
			result.push([node.key, node.value]);
		});
		return result;
	}

	floorKey(key: K): K | undefined {
		let result: K | undefined = undefined;
		let current = this.root;
		while (current !== null) {
			const cmp = this.comparator(key, current.key);
			if (cmp === 0) {
				return current.key;
			} else if (cmp > 0) {
				result = current.key;
				current = current.right;
			} else {
				current = current.left;
			}
		}
		return result;
	}

	ceilingKey(key: K): K | undefined {
		let result: K | undefined = undefined;
		let current = this.root;
		while (current !== null) {
			const cmp = this.comparator(key, current.key);
			if (cmp === 0) {
				return current.key;
			} else if (cmp < 0) {
				result = current.key;
				current = current.left;
			} else {
				current = current.right;
			}
		}
		return result;
	}

	lowerKey(key: K): K | undefined {
		let result: K | undefined = undefined;
		let current = this.root;
		while (current !== null) {
			const cmp = this.comparator(key, current.key);
			if (cmp > 0) {
				result = current.key;
				current = current.right;
			} else {
				current = current.left;
			}
		}
		return result;
	}

	higherKey(key: K): K | undefined {
		let result: K | undefined = undefined;
		let current = this.root;
		while (current !== null) {
			const cmp = this.comparator(key, current.key);
			if (cmp < 0) {
				result = current.key;
				current = current.left;
			} else {
				current = current.right;
			}
		}
		return result;
	}

	firstKey(): K | undefined {
		let current = this.root;
		while (current !== null && current.left !== null) {
			current = current.left;
		}
		return current ? current.key : undefined;
	}

	lastKey(): K | undefined {
		let current = this.root;
		while (current !== null && current.right !== null) {
			current = current.right;
		}
		return current ? current.key : undefined;
	}

	subMap(
		fromKey: K,
		toKey: K,
		options?: { fromInclusive?: boolean; toInclusive?: boolean }
	): [K, V][] {
		const fromInclusive = options?.fromInclusive !== false;
		const toInclusive = options?.toInclusive !== false;

		if (this.comparator(fromKey, toKey) > 0) {
			return [];
		}

		const result: [K, V][] = [];
		this.inorderTraverse(this.root, (node) => {
			const cmpFrom = this.comparator(node.key, fromKey);
			const cmpTo = this.comparator(node.key, toKey);

			const fromOk = fromInclusive ? cmpFrom >= 0 : cmpFrom > 0;
			const toOk = toInclusive ? cmpTo <= 0 : cmpTo < 0;

			if (fromOk && toOk) {
				result.push([node.key, node.value]);
			}
		});
		return result;
	}

	private findNode(node: TreeNode<K, V> | null, key: K): TreeNode<K, V> | null {
		while (node !== null) {
			const cmp = this.comparator(key, node.key);
			if (cmp === 0) {
				return node;
			} else if (cmp < 0) {
				node = node.left;
			} else {
				node = node.right;
			}
		}
		return null;
	}

	private insertNode(
		node: TreeNode<K, V> | null,
		key: K,
		value: V
	): TreeNode<K, V> {
		if (node === null) {
			return new TreeNode(key, value);
		}

		const cmp = this.comparator(key, node.key);
		if (cmp < 0) {
			node.left = this.insertNode(node.left, key, value);
		} else if (cmp > 0) {
			node.right = this.insertNode(node.right, key, value);
		} else {
			return node;
		}

		return this.balance(node);
	}

	private deleteNode(node: TreeNode<K, V> | null, key: K): TreeNode<K, V> | null {
		if (node === null) {
			return null;
		}

		const cmp = this.comparator(key, node.key);
		if (cmp < 0) {
			node.left = this.deleteNode(node.left, key);
		} else if (cmp > 0) {
			node.right = this.deleteNode(node.right, key);
		} else {
			if (node.left === null && node.right === null) {
				return null;
			} else if (node.left === null) {
				return node.right;
			} else if (node.right === null) {
				return node.left;
			} else {
				let successor = node.right;
				while (successor.left !== null) {
					successor = successor.left;
				}
				node.key = successor.key;
				node.value = successor.value;
				node.right = this.deleteNode(node.right, successor.key);
			}
		}

		return this.balance(node);
	}

	private balance(node: TreeNode<K, V>): TreeNode<K, V> {
		this.updateHeight(node);
		const balanceFactor = this.getBalanceFactor(node);

		if (balanceFactor > 1) {
			if (node.left !== null && this.getBalanceFactor(node.left) < 0) {
				node.left = this.rotateLeft(node.left);
			}
			return this.rotateRight(node);
		}

		if (balanceFactor < -1) {
			if (node.right !== null && this.getBalanceFactor(node.right) > 0) {
				node.right = this.rotateRight(node.right);
			}
			return this.rotateLeft(node);
		}

		return node;
	}

	private rotateRight(node: TreeNode<K, V>): TreeNode<K, V> {
		const newRoot = node.left!;
		node.left = newRoot.right;
		newRoot.right = node;
		this.updateHeight(node);
		this.updateHeight(newRoot);
		return newRoot;
	}

	private rotateLeft(node: TreeNode<K, V>): TreeNode<K, V> {
		const newRoot = node.right!;
		node.right = newRoot.left;
		newRoot.left = node;
		this.updateHeight(node);
		this.updateHeight(newRoot);
		return newRoot;
	}

	private updateHeight(node: TreeNode<K, V>): void {
		const leftHeight = node.left ? node.left.height : 0;
		const rightHeight = node.right ? node.right.height : 0;
		node.height = 1 + Math.max(leftHeight, rightHeight);
	}

	private getBalanceFactor(node: TreeNode<K, V>): number {
		const leftHeight = node.left ? node.left.height : 0;
		const rightHeight = node.right ? node.right.height : 0;
		return leftHeight - rightHeight;
	}

	private inorderTraverse(
		node: TreeNode<K, V> | null,
		callback: (node: TreeNode<K, V>) => void
	): void {
		if (node === null) {
			return;
		}
		this.inorderTraverse(node.left, callback);
		callback(node);
		this.inorderTraverse(node.right, callback);
	}
}