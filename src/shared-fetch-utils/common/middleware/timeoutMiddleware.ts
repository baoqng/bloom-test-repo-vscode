// bloom-deps:

export class RequestTimeoutError extends Error {
	readonly timeoutMs: number;

	constructor(message: string, timeoutMs: number) {
		super(message);
		this.name = 'RequestTimeoutError';
		this.timeoutMs = timeoutMs;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, RequestTimeoutError);
		}
	}
}