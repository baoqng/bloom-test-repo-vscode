// bloom-deps:

function parallelRace(tasks: Array<() => Promise<unknown>>, concurrency: number): Promise<unknown> {
	// Validate concurrency parameter
	if (!Number.isInteger(concurrency) || concurrency < 1) {
		throw new TypeError('Concurrency must be a positive integer.');
	}

	// Handle empty tasks array
	if (tasks.length === 0) {
		return Promise.reject(new AggregateError([], 'All tasks rejected'));
	}

	return new Promise((resolve, reject) => {
		const errors: unknown[] = [];
		let completedCount = 0;
		let nextIndex = 0;
		let winner: boolean = false;

		const worker = async (): Promise<void> => {
			while (nextIndex < tasks.length && !winner) {
				const index = nextIndex++;
				try {
					const result = await tasks[index]();
					if (!winner) {
						winner = true;
						resolve(result);
					}
				} catch (err) {
					errors[index] = err;
					completedCount++;

					if (completedCount === tasks.length && !winner) {
						reject(new AggregateError(errors, 'All tasks rejected'));
					}
				}
			}
		};

		const workerCount = Math.min(concurrency, tasks.length);
		for (let i = 0; i < workerCount; i++) {
			worker();
		}
	});
}

export { parallelRace };