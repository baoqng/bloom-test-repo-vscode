// bloom-deps:

export class Deque<T> {
	private head: Node<T> | null = null;
	private tail: Node<T> | null = null;
	private length: number = 0;

	pushFront(item: T): void {
		const node = new Node(item);
		if (this.head === null) {
			this.head = node;
			this.tail = node;
		} else {
			node.next = this.head;
			this.head.prev = node;
			this.head = node;
		}
		this.length++;
	}

	pushBack(item: T): void {
		const node = new Node(item);
		if (this.tail === null) {
			this.head = node;
			this.tail = node;
		} else {
			node.prev = this.tail;
			this.tail.next = node;
			this.tail = node;
		}
		this.length++;
	}

	popFront(): T | undefined {
		if (this.head === null) {
			return undefined;
		}
		const value = this.head.value;
		if (this.head === this.tail) {
			this.head = null;
			this.tail = null;
		} else {
			this.head = this.head.next!;
			this.head.prev = null;
		}
		this.length--;
		return value;
	}

	popBack(): T | undefined {
		if (this.tail === null) {
			return undefined;
		}
		const value = this.tail.value;
		if (this.head === this.tail) {
			this.head = null;
			this.tail = null;
		} else {
			this.tail = this.tail.prev!;
			this.tail.next = null;
		}
		this.length--;
		return value;
	}

	peekFront(): T | undefined {
		return this.head?.value;
	}

	peekBack(): T | undefined {
		return this.tail?.value;
	}

	get size(): number {
		return this.length;
	}

	get isEmpty(): boolean {
		return this.length === 0;
	}

	toArray(): T[] {
		const result: T[] = [];
		let current = this.head;
		while (current !== null) {
			result.push(current.value);
			current = current.next;
		}
		return result;
	}

	[Symbol.iterator](): Iterator<T> {
		return {
			next: (() => {
				let current = this.head;
				return () => {
					if (current === null) {
						return { done: true, value: undefined };
					}
					const value = current.value;
					current = current.next;
					return { done: false, value };
				};
			})(),
		};
	}

	clear(): void {
		this.head = null;
		this.tail = null;
		this.length = 0;
	}

	at(index: number): T | undefined {
		if (typeof index !== 'number' || !Number.isInteger(index)) {
			throw new TypeError('Index must be an integer');
		}

		const normalizedIndex = index < 0 ? this.length + index : index;

		if (normalizedIndex < 0 || normalizedIndex >= this.length) {
			return undefined;
		}

		if (normalizedIndex < this.length / 2) {
			let current = this.head;
			for (let i = 0; i < normalizedIndex; i++) {
				current = current!.next;
			}
			return current!.value;
		} else {
			let current = this.tail;
			for (let i = this.length - 1; i > normalizedIndex; i--) {
				current = current!.prev;
			}
			return current!.value;
		}
	}
}

class Node<T> {
	constructor(public value: T) {}
	next: Node<T> | null = null;
	prev: Node<T> | null = null;
}