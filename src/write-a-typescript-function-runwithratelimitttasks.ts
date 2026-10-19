// bloom-deps:

export function runWithRateLimit<T>(
	tasks: Array<() => Promise<T>>,
	maxConcurrent: number
): Promise<T[]> {
	if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
		throw new RangeError('Concurrency must be a positive integer.');
	}

	const results = new Array<T>(tasks.length);
	let nextIndex = 0;
	let firstError: { value: unknown } | undefined;

	async function worker(): Promise<void> {
		while (!firstError && nextIndex < tasks.length) {
			const index = nextIndex++;
			try {
				results[index] = await tasks[index]();
			} catch (error) {
				firstError ??= { value: error };
			}
		}
	}

	const workerCount = Math.min(maxConcurrent, tasks.length);
	return Promise.all(Array.from({ length: workerCount }, worker)).then(() => {
		if (firstError) {
			throw firstError.value;
		}
		return results;
	});
}