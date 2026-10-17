// bloom-deps:

export class SparseArray<T> {
	private _map: Map<number, T> = new Map();

	private _validateIndex(index: number): void {
		if (!Number.isInteger(index)) {
			throw new RangeError('index must be a non-negative safe integer');
		}
		if (index < 0) {
			throw new RangeError('index must be a non-negative safe integer');
		}
		if (!Number.isSafeInteger(index)) {
			throw new RangeError('index must be a non-negative safe integer');
		}
	}

	set(index: number, value: T): void {
		this._validateIndex(index);
		this._map.set(index, value);
	}

	get(index: number): T | undefined {
		this._validateIndex(index);
		return this._map.get(index);
	}

	has(index: number): boolean {
		this._validateIndex(index);
		return this._map.has(index);
	}

	delete(index: number): boolean {
		this._validateIndex(index);
		return this._map.delete(index);
	}

	get size(): number {
		return this._map.size;
	}

	indices(): number[] {
		return Array.from(this._map.keys()).sort((a, b) => a - b);
	}

	values(): T[] {
		const sorted = Array.from(this._map.keys()).sort((a, b) => a - b);
		return sorted.map(index => this._map.get(index)!);
	}

	entries(): [number, T][] {
		const sorted = Array.from(this._map.keys()).sort((a, b) => a - b);
		return sorted.map(index => [index, this._map.get(index)!]);
	}

	slice(from: number, to: number): SparseArray<T> {
		this._validateIndex(from);
		this._validateIndex(to);

		const result = new SparseArray<T>();

		if (from >= to) {
			return result;
		}

		for (const [index, value] of this._map.entries()) {
			if (index >= from && index < to) {
				result.set(index - from, value);
			}
		}

		return result;
	}

	fill(from: number, to: number, value: T): void {
		this._validateIndex(from);
		this._validateIndex(to);

		if (from > to) {
			throw new RangeError('from must be less than or equal to to');
		}

		for (let i = from; i < to; i++) {
			this._map.set(i, value);
		}
	}

	clear(): void {
		this._map.clear();
	}

	firstIndex(): number | undefined {
		if (this._map.size === 0) {
			return undefined;
		}
		const sorted = Array.from(this._map.keys()).sort((a, b) => a - b);
		return sorted[0];
	}

	lastIndex(): number | undefined {
		if (this._map.size === 0) {
			return undefined;
		}
		const sorted = Array.from(this._map.keys()).sort((a, b) => a - b);
		return sorted[sorted.length - 1];
	}
}