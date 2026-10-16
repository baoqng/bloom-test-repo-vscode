// bloom-deps:

export function clampToRange(value: number, min: number, max: number): number {
	// Validate that all inputs are finite numbers
	if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
		return value;
	}

	// Clamp value to [min, max] range with inclusive boundaries
	return Math.min(Math.max(value, min), max);
}