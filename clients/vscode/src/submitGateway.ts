// bloom-deps:

export function parseEnrichmentSources(raw: unknown): Array<{ filePath: string; line: number }> {
	try {
		// Handle null, undefined, non-array, or empty array
		if (raw === null || raw === undefined || !Array.isArray(raw) || raw.length === 0) {
			return [];
		}

		const result: Array<{ filePath: string; line: number }> = [];

		for (const entry of raw) {
			// Entry must be an object
			if (typeof entry !== 'object' || entry === null) {
				continue;
			}

			const { filePath, line } = entry as Record<string, unknown>;

			// filePath must be a non-empty string
			if (typeof filePath !== 'string' || filePath.length === 0) {
				continue;
			}

			// line must be an integer >= 1
			if (typeof line !== 'number' || !Number.isInteger(line) || line < 1) {
				continue;
			}

			result.push({ filePath, line });
		}

		return result;
	} catch {
		// Never throw — parse errors must not block submission
		return [];
	}
}