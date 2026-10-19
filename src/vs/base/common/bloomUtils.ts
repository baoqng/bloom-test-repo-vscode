// bloom-deps:

export async function withRetry<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
	if (maxAttempts < 1) {
		throw new RangeError('maxAttempts must be at least 1');
	}

	let lastError: Error | undefined;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			// If there are remaining attempts, wait and retry
			if (attempt < maxAttempts - 1) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}
	}

	// All attempts failed, rethrow the last error
	throw lastError;
}