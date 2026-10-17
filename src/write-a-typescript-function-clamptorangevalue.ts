// bloom-deps:

export function clampToRange(value: unknown, min: number, max: number): number {
	// Check 1: typeof value must be 'number'
	if (typeof value !== 'number') {
		throw new TypeError('value must be a number');
	}

	// Check 2: value must not be NaN
	if (Number.isNaN(value)) {
		throw new TypeError('value must not be NaN');
	}

	// Check 3: value must be finite
	if (!Number.isFinite(value)) {
		throw new TypeError('value must be finite');
	}

	// Check 4: min must not exceed max
	if (min > max) {
		throw new RangeError('min must not exceed max');
	}

	// Clamp and return
	return Math.max(min, Math.min(max, value));
}