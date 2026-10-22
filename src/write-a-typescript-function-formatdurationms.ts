// bloom-deps:

function formatDuration(ms: unknown): string {
	// Validate input is a finite number
	if (typeof ms !== 'number' || !Number.isFinite(ms)) {
		throw new TypeError('Duration must be a finite number');
	}

	// Reject negative values
	if (ms < 0) {
		throw new RangeError('Duration must be non-negative');
	}

	// 0–999ms → 'Nms'
	if (ms < 1000) {
		return `${Math.floor(ms)}ms`;
	}

	// Extract time units using floor division
	const totalSeconds = Math.floor(ms / 1000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);

	// 1000–59999ms (1–59 seconds) → 'Ns'
	if (totalSeconds < 60) {
		return `${totalSeconds}s`;
	}

	// 60000–3599999ms (1–59 minutes) → 'Nm' or 'Nm Ns'
	if (totalMinutes < 60) {
		const minutes = totalMinutes;
		const seconds = totalSeconds % 60;

		if (seconds === 0) {
			return `${minutes}m`;
		}
		return `${minutes}m ${seconds}s`;
	}

	// 3600000+ ms (1+ hours) → 'Nh' or 'Nh Nm'
	const hours = totalHours;
	const minutes = totalMinutes % 60;

	if (minutes === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${minutes}m`;
}

export { formatDuration };