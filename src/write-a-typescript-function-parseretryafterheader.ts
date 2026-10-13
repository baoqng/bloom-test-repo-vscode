// bloom-deps:

function parseRetryAfter(header: unknown, nowMs: number): number {
	// Validate header type
	if (typeof header !== 'string') {
		throw new TypeError('header must be a string');
	}

	// Validate nowMs type
	if (typeof nowMs !== 'number' || !Number.isFinite(nowMs)) {
		throw new TypeError('nowMs must be a finite number');
	}

	// Normalize whitespace
	const normalized = header.trim();

	// Reject empty string
	if (normalized.length === 0) {
		throw new SyntaxError('Retry-After header cannot be empty');
	}

	// Check if it's a digit-only string (delay in seconds)
	if (/^\d+$/.test(normalized)) {
		const seconds = parseInt(normalized, 10);
		const milliseconds = seconds * 1000;

		// Check for overflow
		if (milliseconds > 2147483647) {
			throw new RangeError('Retry-After delay in seconds exceeds maximum value');
		}

		return milliseconds;
	}

	// Reject signed numbers (e.g., '+5', '-3')
	if (/^[+\-]/.test(normalized)) {
		throw new SyntaxError('Retry-After header cannot be a signed number');
	}

	// Reject decimal numbers (e.g., '1.5')
	if (/^\d*\.\d+/.test(normalized)) {
		throw new SyntaxError('Retry-After header cannot be a decimal number');
	}

	// Try to parse as IMF-fixdate
	// IMF-fixdate format: "Wed, 21 Oct 2026 07:28:00 GMT"
	const dateMs = Date.parse(normalized);

	if (!Number.isFinite(dateMs)) {
		throw new SyntaxError('Retry-After header is not a valid delay in seconds or IMF-fixdate');
	}

	// If date is in the past or equal to now, return 0
	if (dateMs <= nowMs) {
		return 0;
	}

	// Return the difference
	return dateMs - nowMs;
}

export { parseRetryAfter };