// bloom-deps:

export interface SerializedFilter {
	m: number;
	k: number;
	capacity: number;
	fpRate: number;
	bits: Uint8Array;
}

export class BloomFilter {
	private m: number; // bit array size
	private k: number; // number of hash functions
	private capacity: number;
	private fpRate: number;
	private bits: Uint8Array;

	constructor(options: { capacity: number; fpRate?: number }) {
		this.capacity = options.capacity;
		this.fpRate = options.fpRate ?? 0.01;

		// Compute m and k using standard formulas
		// m = ceil(-n * ln(p) / (ln(2)^2))
		const ln2Squared = Math.log(2) ** 2;
		let m = Math.ceil(
			(-this.capacity * Math.log(this.fpRate)) / ln2Squared
		);
		m = Math.max(m, 8); // minimum m=8

		// k = round((m / n) * ln(2))
		let k = Math.round((m / this.capacity) * Math.log(2));
		k = Math.max(k, 1); // minimum k=1

		this.m = m;
		this.k = k;

		// Initialize bit array: m bits stored in Uint8Array
		// Each Uint8 holds 8 bits, so we need ceil(m / 8) bytes
		this.bits = new Uint8Array(Math.ceil(m / 8));
	}

	static from(serialized: SerializedFilter): BloomFilter {
		const filter = new BloomFilter({
			capacity: serialized.capacity,
			fpRate: serialized.fpRate,
		});
		filter.m = serialized.m;
		filter.k = serialized.k;
		filter.bits = new Uint8Array(serialized.bits);
		return filter;
	}

	private fnv1a(input: string): number {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(input);

		let hash = 0x811c9dc5; // FNV offset basis (32-bit)
		const fnvPrime = 0x01000193;

		for (const byte of bytes) {
			hash ^= byte;
			hash = (hash * fnvPrime) >>> 0; // Keep as 32-bit unsigned
		}

		return hash >>> 0; // Ensure unsigned 32-bit
	}

	private djb2(input: string): number {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(input);

		let hash = 5381; // djb2 initial value

		for (const byte of bytes) {
			hash = ((hash << 5) + hash + byte) >>> 0; // Keep as 32-bit unsigned
		}

		return hash >>> 0; // Ensure unsigned 32-bit
	}

	private getHashPosition(item: string, i: number): number {
		const hash1 = this.fnv1a(item);
		const hash2 = this.djb2(item);
		return ((hash1 + i * hash2) >>> 0) % this.m;
	}

	private setBit(position: number): void {
		const byteIndex = Math.floor(position / 8);
		const bitIndex = position % 8;
		this.bits[byteIndex] |= 1 << bitIndex;
	}

	private getBit(position: number): boolean {
		const byteIndex = Math.floor(position / 8);
		const bitIndex = position % 8;
		return ((this.bits[byteIndex] >> bitIndex) & 1) === 1;
	}

	add(item: string): void {
		for (let i = 0; i < this.k; i++) {
			const position = this.getHashPosition(item, i);
			this.setBit(position);
		}
	}

	addAll(items: string[]): void {
		for (const item of items) {
			this.add(item);
		}
	}

	has(item: string): boolean {
		for (let i = 0; i < this.k; i++) {
			const position = this.getHashPosition(item, i);
			if (!this.getBit(position)) {
				return false;
			}
		}
		return true;
	}

	get estimatedSize(): number {
		let setBits = 0;
		for (let i = 0; i < this.bits.length; i++) {
			let byte = this.bits[i];
			while (byte) {
				setBits += byte & 1;
				byte >>= 1;
			}
		}

		// Handle edge case: if all bits are set or none are set
		if (setBits === 0) {
			return 0;
		}
		if (setBits === this.m) {
			return this.capacity; // Conservative estimate
		}

		// estimatedSize = round(-m / k * ln(1 - setBits / m))
		const fraction = 1 - setBits / this.m;
		return Math.round((-this.m / this.k) * Math.log(fraction));
	}

	get fillRatio(): number {
		let setBits = 0;
		for (let i = 0; i < this.bits.length; i++) {
			let byte = this.bits[i];
			while (byte) {
				setBits += byte & 1;
				byte >>= 1;
			}
		}
		return setBits / this.m;
	}

	serialize(): SerializedFilter {
		return {
			m: this.m,
			k: this.k,
			capacity: this.capacity,
			fpRate: this.fpRate,
			bits: new Uint8Array(this.bits),
		};
	}

	merge(other: BloomFilter): BloomFilter {
		if (this.m !== other.m || this.k !== other.k) {
			throw new Error(
				"Cannot merge filters with different m or k values"
			);
		}

		const merged = new BloomFilter({
			capacity: this.capacity,
			fpRate: this.fpRate,
		});
		merged.m = this.m;
		merged.k = this.k;
		merged.bits = new Uint8Array(this.bits.length);

		// OR the bits together
		for (let i = 0; i < this.bits.length; i++) {
			merged.bits[i] = this.bits[i] | other.bits[i];
		}

		return merged;
	}

	clear(): void {
		this.bits.fill(0);
	}
}