// bloom-deps:

function toPercent(numerator: number, denominator: number): number {
	if (denominator === 0) {
		throw new RangeError('denominator cannot be zero');
	}
	const result = (numerator / denominator) * 100;
	return Math.round(result * 100) / 100;
}

export { toPercent };