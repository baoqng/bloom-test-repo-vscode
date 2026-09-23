// bloom-deps:

export interface ISerializedLineRange {
	startLineNumber: number;
	endLineNumberExclusive: number;
}

export class LineRange {
	public static fromRange(range: { startLineNumber: number; endLineNumber: number }): LineRange {
		return new LineRange(range.startLineNumber, range.endLineNumber + 1);
	}

	public static subtract(a: LineRange, b: LineRange | undefined): LineRange[] {
		if (!b) {
			return [a];
		}
		if (a.startLineNumber < b.startLineNumber && b.endLineNumberExclusive < a.endLineNumberExclusive) {
			return [
				new LineRange(a.startLineNumber, b.startLineNumber),
				new LineRange(b.endLineNumberExclusive, a.endLineNumberExclusive)
			];
		} else if (b.startLineNumber <= a.startLineNumber && a.endLineNumberExclusive <= b.endLineNumberExclusive) {
			return [];
		} else if (b.endLineNumberExclusive < a.endLineNumberExclusive) {
			return [new LineRange(Math.max(b.endLineNumberExclusive, a.startLineNumber), a.endLineNumberExclusive)];
		} else {
			return [new LineRange(a.startLineNumber, Math.min(b.startLineNumber, a.endLineNumberExclusive))];
		}
	}

	public readonly startLineNumber: number;
	public readonly endLineNumberExclusive: number;

	constructor(startLineNumber: number, endLineNumberExclusive: number) {
		if (startLineNumber > endLineNumberExclusive) {
			throw new Error(
				`Invalid LineRange: startLineNumber (${startLineNumber}) must be <= endLineNumberExclusive (${endLineNumberExclusive})`
			);
		}
		this.startLineNumber = startLineNumber;
		this.endLineNumberExclusive = endLineNumberExclusive;
	}

	public get isEmpty(): boolean {
		return this.startLineNumber === this.endLineNumberExclusive;
	}

	public get length(): number {
		return this.endLineNumberExclusive - this.startLineNumber;
	}

	public contains(lineNumber: number): boolean {
		return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
	}

	public intersects(other: LineRange): boolean {
		return this.startLineNumber < other.endLineNumberExclusive && other.startLineNumber < this.endLineNumberExclusive;
	}

	public equals(other: LineRange): boolean {
		return this.startLineNumber === other.startLineNumber && this.endLineNumberExclusive === other.endLineNumberExclusive;
	}

	public join(other: LineRange): LineRange {
		return new LineRange(
			Math.min(this.startLineNumber, other.startLineNumber),
			Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive)
		);
	}

	public intersect(other: LineRange): LineRange | undefined {
		const start = Math.max(this.startLineNumber, other.startLineNumber);
		const end = Math.min(this.endLineNumberExclusive, other.endLineNumberExclusive);
		if (start <= end) {
			return new LineRange(start, end);
		}
		return undefined;
	}

	/**
	 * Returns the parts of `this` not covered by `other`, as 0, 1, or 2 LineRange instances.
	 *
	 * - No overlap: returns [this]
	 * - other entirely covers this: returns []
	 * - other overlaps only the start of this: returns single range from other.endLineNumberExclusive to this.endLineNumberExclusive
	 * - other overlaps only the end of this: returns single range from this.startLineNumber to other.startLineNumber
	 * - other strictly inside this: returns two ranges
	 */
	public subtract(other: LineRange): LineRange[] {
		// No overlap: other is entirely before or entirely after this
		if (other.endLineNumberExclusive <= this.startLineNumber || other.startLineNumber >= this.endLineNumberExclusive) {
			return [this];
		}

		// other entirely covers this
		if (other.startLineNumber <= this.startLineNumber && other.endLineNumberExclusive >= this.endLineNumberExclusive) {
			return [];
		}

		// other overlaps only the start of this (other starts at or before this.startLineNumber, ends before this.endLineNumberExclusive)
		if (other.startLineNumber <= this.startLineNumber && other.endLineNumberExclusive < this.endLineNumberExclusive) {
			return [new LineRange(other.endLineNumberExclusive, this.endLineNumberExclusive)];
		}

		// other overlaps only the end of this (other starts after this.startLineNumber, ends at or after this.endLineNumberExclusive)
		if (other.startLineNumber > this.startLineNumber && other.endLineNumberExclusive >= this.endLineNumberExclusive) {
			return [new LineRange(this.startLineNumber, other.startLineNumber)];
		}

		// other falls strictly inside this
		return [
			new LineRange(this.startLineNumber, other.startLineNumber),
			new LineRange(other.endLineNumberExclusive, this.endLineNumberExclusive)
		];
	}

	public toJSON(): ISerializedLineRange {
		return {
			startLineNumber: this.startLineNumber,
			endLineNumberExclusive: this.endLineNumberExclusive
		};
	}

	public static fromJSON(serialized: ISerializedLineRange): LineRange {
		return new LineRange(serialized.startLineNumber, serialized.endLineNumberExclusive);
	}

	public toString(): string {
		return `[${this.startLineNumber}, ${this.endLineNumberExclusive})`;
	}
}