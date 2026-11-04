// bloom-deps:

export function clampNumber(value: number, min: number, max: number): number {
	// Validate input types
	if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
		throw new RangeError('All arguments must be numbers');
	}

	// Validate that value, min, and max are not NaN
	if (Number.isNaN(value) || Number.isNaN(min) || Number.isNaN(max)) {
		throw new RangeError('Arguments must not be NaN');
	}

	// Validate that min <= max
	if (min > max) {
		throw new RangeError('min must be less than or equal to max');
	}

	// Clamp value to [min, max] range (inclusive boundaries)
	return Math.min(Math.max(value, min), max);
}