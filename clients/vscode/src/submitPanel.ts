// bloom-deps:

export function truncateRequirement(text: string, maxLength: number): string {
	// Validate text parameter
	if (typeof text !== 'string') {
		throw new TypeError('text must be a string');
	}

	// Validate maxLength parameter
	if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || !Number.isInteger(maxLength)) {
		throw new TypeError('maxLength must be a finite integer');
	}

	// Check minimum length requirement
	if (maxLength < 10) {
		throw new RangeError('maxLength must be at least 10');
	}

	// Return unchanged if within limit
	if (text.length <= maxLength) {
		return text;
	}

	// Find the last space before maxLength (but reserve 3 chars for '...')
	const lastSpace = text.lastIndexOf(' ', maxLength - 3);

	if (lastSpace > 0) {
		// Word boundary exists before maxLength, truncate at last space
		return text.substring(0, lastSpace) + '...';
	} else {
		// No word boundary found, hard truncate at maxLength - 3
		return text.substring(0, maxLength - 3) + '...';
	}
}