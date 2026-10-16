export class CircularBuffer<T> {
	private data: T[] = [];
	private head: number = 0;
	private count: number = 0;
	private readonly capacityValue: number;

	constructor(capacity: number) {
		if (!Number.isInteger(capacity)) {
			throw new RangeError(`Capacity must be an integer, got ${capacity}`);
		}
		if (capacity < 1) {
			throw new RangeError(`Capacity must be at least 1, got ${capacity}`);
		}
		this.capacityValue = capacity;
		this.data = new Array(capacity);
	}

	push(item: T): boolean {
		const wasOverwrite = this.count === this.capacityValue;

		if (wasOverwrite) {
			// Overwrite the oldest item (at head, which is the tail when full)
			this.data[this.head] = item;
			this.head = (this.head + 1) % this.capacityValue;
		} else {
			// Write at the next available position: (head + count) % capacity
			const writeIndex = (this.head + this.count) % this.capacityValue;
			this.data[writeIndex] = item;
			this.count++;
		}

		return !wasOverwrite;
	}

	pop(): T | undefined {
		if (this.count === 0) {
			return undefined;
		}

		const item = this.data[this.head];
		this.head = (this.head + 1) % this.capacityValue;
		this.count--;

		return item;
	}

	peek(): T | undefined {
		if (this.count === 0) {
			return undefined;
		}

		return this.data[this.head];
	}

	peekLast(): T | undefined {
		if (this.count === 0) {
			return undefined;
		}

		const lastIndex = (this.head + this.count - 1) % this.capacityValue;
		return this.data[lastIndex];
	}

	drain(): T[] {
		const result: T[] = [];

		while (this.count > 0) {
			result.push(this.pop()!);
		}

		return result;
	}

	toArray(): T[] {
		const result: T[] = [];

		for (let i = 0; i < this.count; i++) {
			const index = (this.head + i) % this.capacityValue;
			result.push(this.data[index]);
		}

		return result;
	}

	get size(): number {
		return this.count;
	}

	get capacity(): number {
		return this.capacityValue;
	}

	get isFull(): boolean {
		return this.count === this.capacityValue;
	}

	get isEmpty(): boolean {
		return this.count === 0;
	}

	[Symbol.iterator]() {
		let index = 0;
		const buffer = this;
		return {
			next() {
				if (index >= buffer.count) {
					return { done: true as const, value: undefined };
				}

				const dataIndex = (buffer.head + index) % buffer.capacityValue;
				const value = buffer.data[dataIndex];
				index++;

				return { done: false as const, value };
			},
		};
	}
}