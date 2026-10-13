// bloom-deps:

function debounceAsync<A extends unknown[], R>(
	fn: (...args: A) => Promise<R>,
	waitMs: number
): (...args: A) => Promise<R> {
	// Validate fn is a function
	if (typeof fn !== "function") {
		throw new TypeError("fn must be a function");
	}

	// Validate waitMs is a non-negative finite number
	if (
		typeof waitMs !== "number" ||
		!Number.isFinite(waitMs) ||
		waitMs < 0
	) {
		throw new RangeError("waitMs must be a non-negative finite number");
	}

	let timeout: ReturnType<typeof setTimeout> | undefined;
	let pending:
		| {
				readonly promise: Promise<R>;
				readonly resolve: (value: R) => void;
				readonly reject: (error: unknown) => void;
		  }
		| undefined;
	let lastArgs: A | undefined;

	return (...args: A): Promise<R> => {
		// Store the most recent arguments
		lastArgs = args;

		// If there's no pending promise, create one
		if (!pending) {
			let resolve!: (value: R) => void;
			let reject!: (error: unknown) => void;
			const promise = new Promise<R>((promiseResolve, promiseReject) => {
				resolve = promiseResolve;
				reject = promiseReject;
			});
			pending = { promise, resolve, reject };
		}

		// Clear existing timer if any
		if (timeout) {
			clearTimeout(timeout);
		}

		// Capture the current pending state
		const current = pending;

		// Set a new timer
		timeout = setTimeout(() => {
			timeout = undefined;
			pending = undefined;

			// Call fn with the most recent arguments
			try {
				const result = fn(...(lastArgs as A));
				// Handle the promise returned by fn
				result
					.then((value) => {
						current.resolve(value);
					})
					.catch((error) => {
						current.reject(error);
					});
			} catch (error) {
				// If fn throws synchronously, reject the shared promise
				current.reject(error);
			}
		}, waitMs);

		// Return the shared promise for this burst
		return current.promise;
	};
}

export { debounceAsync };