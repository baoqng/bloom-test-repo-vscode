// bloom-deps:

export interface PriorityQueueOptions<T> {
	comparator?: (a: T, b: T) => number;
	initialValues?: T[];
}

/**
 * A priority queue implementation using a binary heap.
 * Default comparator creates a min-heap (smallest value = highest priority).
 */
export class PriorityQueue<T> {
	private items: T[];
	private comparator: (a: T, b: T) => number;

	constructor(options?: PriorityQueueOptions<T>) {
		this.comparator = options?.comparator ?? ((a: T, b: T) => {
			if (typeof a === 'number' && typeof b === 'number') {
				return a - b;
			}
			return a < b ? -1 : a > b ? 1 : 0;
		});

		this.items = [];

		if (options?.initialValues && options.initialValues.length > 0) {
			this.items = [...options.initialValues];
			this.heapify();
		}
	}

	/**
	 * Insert an item into the priority queue.
	 */
	push(item: T): void {
		this.items.push(item);
		this.siftUp(this.items.length - 1);
	}

	/**
	 * Remove and return the highest-priority item.
	 * Throws RangeError if the queue is empty.
	 */
	pop(): T {
		if (this.items.length === 0) {
			throw new RangeError('PriorityQueue is empty');
		}

		if (this.items.length === 1) {
			return this.items.pop()!;
		}

		const top = this.items[0];
		this.items[0] = this.items.pop()!;
		this.siftDown(0);
		return top;
	}

	/**
	 * Return the highest-priority item without removing it.
	 * Throws RangeError if the queue is empty.
	 */
	peek(): T {
		if (this.items.length === 0) {
			throw new RangeError('PriorityQueue is empty');
		}
		return this.items[0];
	}

	/**
	 * Return the number of items in the queue.
	 */
	get size(): number {
		return this.items.length;
	}

	/**
	 * Check if the queue is empty.
	 */
	isEmpty(): boolean {
		return this.items.length === 0;
	}

	/**
	 * Return all items in arbitrary heap order (not sorted).
	 */
	toArray(): T[] {
		return [...this.items];
	}

	/**
	 * Remove all items from the queue.
	 */
	clear(): void {
		this.items = [];
	}

	/**
	 * Floyd's algorithm: build a min-heap in O(n) time.
	 * Start from the last non-leaf node and sift down.
	 */
	private heapify(): void {
		const n = this.items.length;
		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			this.siftDown(i);
		}
	}

	/**
	 * Move an element up the heap to maintain heap property.
	 */
	private siftUp(index: number): void {
		const element = this.items[index];
		while (index > 0) {
			const parentIndex = Math.floor((index - 1) / 2);
			const parent = this.items[parentIndex];

			if (this.comparator(element, parent) >= 0) {
				break;
			}

			this.items[index] = parent;
			index = parentIndex;
		}
		this.items[index] = element;
	}

	/**
	 * Move an element down the heap to maintain heap property.
	 */
	private siftDown(index: number): void {
		const length = this.items.length;
		const element = this.items[index];
		const halfLength = Math.floor(length / 2);

		while (index < halfLength) {
			let childIndex = (index << 1) + 1;
			let child = this.items[childIndex];
			const rightIndex = childIndex + 1;

			if (rightIndex < length && this.comparator(this.items[rightIndex], child) < 0) {
				childIndex = rightIndex;
				child = this.items[rightIndex];
			}

			if (this.comparator(element, child) <= 0) {
				break;
			}

			this.items[index] = child;
			index = childIndex;
		}

		this.items[index] = element;
	}
}