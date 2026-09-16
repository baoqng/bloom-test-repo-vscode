// bloom-deps:

export class NetworkTimeoutError extends Error {
	constructor(message: string, readonly deadlineMs: number) {
		super(message);
		this.name = 'NetworkTimeoutError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}