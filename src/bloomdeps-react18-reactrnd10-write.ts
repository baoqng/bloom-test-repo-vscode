// bloom-deps:

function clampValue(value: number, min: number, max: number): number {
	// Validate input types
	if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
		throw new RangeError('All arguments must be numbers');
	}

	// Validate that min <= max
	if (min > max) {
		throw new RangeError('min must be less than or equal to max');
	}

	// Clamp the value to the inclusive range [min, max]
	return Math.max(min, Math.min(value, max));
}

export { clampValue };