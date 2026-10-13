export function parseByteRange(header: unknown, size: number): Array<[number, number]> {
	// Validate header is a string
	if (typeof header !== 'string') {
		throw new TypeError('header must be a string');
	}

	// Validate size is a non-negative safe integer
	if (!Number.isInteger(size) || size < 0 || !Number.isSafeInteger(size)) {
		throw new RangeError('size must be a non-negative safe integer');
	}

	// Check for 'bytes=' prefix
	if (!header.startsWith('bytes=')) {
		throw new SyntaxError('header must start with "bytes="');
	}

	// Extract the range specs part
	const rangeSpecs = header.slice(6);

	// Split by comma and process each spec
	const specs = rangeSpecs.split(',');
	const ranges: Array<[number, number]> = [];

	for (const spec of specs) {
		const trimmedSpec = spec.trim();

		// Reject empty specs
		if (trimmedSpec === '') {
			throw new SyntaxError('empty spec');
		}

		let start: number;
		let end: number;

		if (trimmedSpec.startsWith('-')) {
			// Suffix spec: -n (last n bytes)
			const suffix = trimmedSpec.slice(1);

			// Check for non-digit characters
			if (!/^\d+$/.test(suffix)) {
				throw new SyntaxError('suffix spec contains non-digit characters');
			}

			const n = parseInt(suffix, 10);

			// Skip suffix specs with n = 0
			if (n === 0) {
				continue;
			}

			// Calculate range for last n bytes
			start = Math.max(0, size - n);
			end = size - 1;
		} else {
			// Regular spec: a-b or a-
			const dashIndex = trimmedSpec.indexOf('-');

			// Check if dash exists
			if (dashIndex === -1) {
				throw new SyntaxError('spec must contain a dash');
			}

			const startStr = trimmedSpec.slice(0, dashIndex);
			const endStr = trimmedSpec.slice(dashIndex + 1);

			// Check for non-digit characters in start
			if (!/^\d+$/.test(startStr)) {
				throw new SyntaxError('spec contains non-digit characters');
			}

			// Check for non-digit characters in end (allow empty for open-ended)
			if (endStr !== '' && !/^\d+$/.test(endStr)) {
				throw new SyntaxError('spec contains non-digit characters');
			}

			start = parseInt(startStr, 10);

			// Handle open-ended range (a-)
			if (endStr === '') {
				end = size - 1;
			} else {
				end = parseInt(endStr, 10);
			}

			// Check if start > end
			if (start > end) {
				throw new SyntaxError('spec start is greater than end');
			}
		}

		// Skip specs whose start is >= size
		if (start >= size) {
			continue;
		}

		// Clamp end to size - 1
		end = Math.min(end, size - 1);

		ranges.push([start, end]);
	}

	// Throw RangeError if no spec remains after skipping
	if (ranges.length === 0) {
		throw new RangeError('unsatisfiable');
	}

	return ranges;
}