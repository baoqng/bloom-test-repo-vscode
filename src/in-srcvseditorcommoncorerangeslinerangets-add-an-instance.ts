// bloom-deps:

export interface ISerializedLineRange {
	startLineNumber: number;
	endLineNumberExclusive: number;
}

export class LineRange {
	public static fromRange(range: { startLineNumber: number; endLineNumber: number }): LineRange {
		return new LineRange(range.startLineNumber, range.endLineNumber + 1);
	}

	public static ofLength(startLineNumber: number, length: number): LineRange {
		return new LineRange(startLineNumber, startLineNumber + length);
	}

	public static deserialize(serialized: ISerializedLineRange): LineRange {
		return new LineRange(serialized.startLineNumber, serialized.endLineNumberExclusive);
	}

	public static joinMany(ranges: readonly (readonly LineRange[])[]): LineRange[] {
		const result: LineRange[] = [];
		for (const r of ranges) {
			for (const range of r) {
				result.push(range);
			}
		}
		return LineRange.join(result);
	}

	public static join(ranges: LineRange[]): LineRange[] {
		if (ranges.length === 0) {
			return [];
		}
		const sorted = [...ranges].sort((a, b) => a.startLineNumber - b.startLineNumber);
		const result: LineRange[] = [sorted[0]];
		for (let i = 1; i < sorted.length; i++) {
			const last = result[result.length - 1];
			const current = sorted[i];
			if (last.endLineNumberExclusive >= current.startLineNumber) {
				result[result.length - 1] = new LineRange(
					last.startLineNumber,
					Math.max(last.endLineNumberExclusive, current.endLineNumberExclusive)
				);
			} else {
				result.push(current);
			}
		}
		return result;
	}

	constructor(
		public readonly startLineNumber: number,
		public readonly endLineNumberExclusive: number
	) {
		if (startLineNumber > endLineNumberExclusive) {
			throw new Error(
				`startLineNumber ${startLineNumber} must be <= endLineNumberExclusive ${endLineNumberExclusive}`
			);
		}
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

	public containsRange(other: LineRange): boolean {
		return this.startLineNumber <= other.startLineNumber &&
			other.endLineNumberExclusive <= this.endLineNumberExclusive;
	}

	public delta(offset: number): LineRange {
		return new LineRange(this.startLineNumber + offset, this.endLineNumberExclusive + offset);
	}

	public deltaLength(delta: number): LineRange {
		return new LineRange(this.startLineNumber, this.endLineNumberExclusive + delta);
	}

	public join(other: LineRange): LineRange {
		return new LineRange(
			Math.min(this.startLineNumber, other.startLineNumber),
			Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive)
		);
	}

	public toString(): string {
		return `[${this.startLineNumber}, ${this.endLineNumberExclusive})`;
	}

	public intersect(other: LineRange): LineRange | undefined {
		const start = Math.max(this.startLineNumber, other.startLineNumber);
		const end = Math.min(this.endLineNumberExclusive, other.endLineNumberExclusive);
		if (start <= end) {
			return new LineRange(start, end);
		}
		return undefined;
	}

	public intersectsStrict(other: LineRange): boolean {
		return this.startLineNumber < other.endLineNumberExclusive &&
			other.startLineNumber < this.endLineNumberExclusive;
	}

	public intersectsOrTouches(other: LineRange): boolean {
		return this.startLineNumber <= other.endLineNumberExclusive &&
			other.startLineNumber <= this.endLineNumberExclusive;
	}

	public equals(other: LineRange): boolean {
		return this.startLineNumber === other.startLineNumber &&
			this.endLineNumberExclusive === other.endLineNumberExclusive;
	}

	public toInclusiveRange(): { startLineNumber: number; endLineNumber: number } | null {
		if (this.isEmpty) {
			return null;
		}
		return {
			startLineNumber: this.startLineNumber,
			endLineNumber: this.endLineNumberExclusive - 1,
		};
	}

	public toExclusiveRange(): { startLineNumber: number; endLineNumberExclusive: number } {
		return {
			startLineNumber: this.startLineNumber,
			endLineNumberExclusive: this.endLineNumberExclusive,
		};
	}

	public mapToLineArray<T>(f: (lineNumber: number) => T): T[] {
		const result: T[] = [];
		for (let i = this.startLineNumber; i < this.endLineNumberExclusive; i++) {
			result.push(f(i));
		}
		return result;
	}

	public forEach(f: (lineNumber: number) => void): void {
		for (let i = this.startLineNumber; i < this.endLineNumberExclusive; i++) {
			f(i);
		}
	}

	public serialize(): ISerializedLineRange {
		return {
			startLineNumber: this.startLineNumber,
			endLineNumberExclusive: this.endLineNumberExclusive,
		};
	}

	public toOffsetRange(): { start: number; length: number } {
		return {
			start: this.startLineNumber - 1,
			length: this.length,
		};
	}

	public distanceToRange(other: LineRange): number {
		if (this.intersectsOrTouches(other)) {
			return 0;
		}
		if (this.endLineNumberExclusive <= other.startLineNumber) {
			return other.startLineNumber - this.endLineNumberExclusive;
		}
		return this.startLineNumber - other.endLineNumberExclusive;
	}

	public distanceToLine(lineNumber: number): number {
		if (this.contains(lineNumber)) {
			return 0;
		}
		if (lineNumber < this.startLineNumber) {
			return this.startLineNumber - lineNumber;
		}
		return lineNumber - (this.endLineNumberExclusive - 1);
	}

	public addMargin(margin: number): LineRange {
		return new LineRange(
			Math.max(1, this.startLineNumber - margin),
			this.endLineNumberExclusive + margin
		);
	}

	public clip(lineCount: number): LineRange {
		const clippedStart = Math.max(1, this.startLineNumber);
		const clippedEnd = Math.min(lineCount + 1, this.endLineNumberExclusive);
		if (clippedStart >= clippedEnd) {
			return LineRange.ofLength(clippedStart, 0);
		}
		return new LineRange(clippedStart, clippedEnd);
	}
}