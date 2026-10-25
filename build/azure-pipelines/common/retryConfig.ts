// bloom-deps:

export interface RetryConfig {
	maxRetries: number;
	delayMs: number;
}

function _assertPositiveInt(value: unknown, name: string): void {
	if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive integer, got ${typeof value === 'number' ? value : typeof value}`);
	}
}

export function parseRetryConfig(raw: Record<string, unknown>): RetryConfig {
	_assertPositiveInt(raw.maxRetries, 'maxRetries');
	_assertPositiveInt(raw.delayMs, 'delayMs');

	return {
		maxRetries: raw.maxRetries as number,
		delayMs: raw.delayMs as number,
	};
}