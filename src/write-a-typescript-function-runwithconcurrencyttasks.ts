// bloom-deps:

export function runWithConcurrency<T>(
	tasks: Array<() => Promise<T>>,
	limit: number
): Promise<T[]> {
	if (!Number.isInteger(limit) || limit < 1) {
		throw new RangeError('Concurrency limit must be a positive integer.');
	}

	if (tasks.length === 0) {
		return Promise.resolve([]);
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

	const workerCount = Math.min(limit, tasks.length);
	return Promise.all(Array.from({ length: workerCount }, () => worker())).then(() => {
		if (firstError) {
			throw firstError.value;
		}
		return results;
	});
}
