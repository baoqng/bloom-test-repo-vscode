// bloom-deps:

/**
 * Returns `true` if `eventTimestampMs` falls strictly within the past `windowMs` milliseconds.
 *
 * Boundary rule: when elapsed time exactly equals `windowMs`, returns `false` (exclusive boundary).
 *
 * Validation:
 * - Returns `false` if `eventTimestampMs` is not a finite number.
 * - Returns `false` if `windowMs` is not a positive finite number.
 * - Returns `false` if `eventTimestampMs` is in the future (> Date.now()).
 *
 * @param eventTimestampMs The timestamp of the event in milliseconds.
 * @param windowMs The time window in milliseconds (must be positive).
 * @returns `true` if the event occurred strictly within the past `windowMs` milliseconds; `false` otherwise.
 */
function isRecentEvent(eventTimestampMs: number, windowMs: number): boolean {
	// Validate eventTimestampMs is a finite number
	if (!Number.isFinite(eventTimestampMs)) {
		return false;
	}

	// Validate windowMs is a positive finite number
	if (!Number.isFinite(windowMs) || windowMs <= 0) {
		return false;
	}

	const now = Date.now();

	// Reject future events
	if (eventTimestampMs > now) {
		return false;
	}

	// Calculate elapsed time since the event
	const elapsed = now - eventTimestampMs;

	// Use strict `<` for exclusive boundary at windowMs
	return elapsed < windowMs;
}

export { isRecentEvent };