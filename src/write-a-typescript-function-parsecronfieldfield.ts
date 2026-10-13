// bloom-deps:

function parseCronField(field: unknown, min: number, max: number): number[] {
	// Validate field is a string
	if (typeof field !== 'string') {
		throw new TypeError('Field must be a string');
	}

	// Validate min is an integer
	if (!Number.isInteger(min)) {
		throw new RangeError('min must be an integer');
	}

	// Validate max is an integer
	if (!Number.isInteger(max)) {
		throw new RangeError('max must be an integer');
	}

	// Validate min <= max
	if (min > max) {
		throw new RangeError('min must be less than or equal to max');
	}

	// Check for whitespace in field
	if (/\s/.test(field)) {
		throw new SyntaxError('Field contains whitespace');
	}

	// Split by comma and process each segment
	const items = field.split(',');
	const values = new Set<number>();

	for (const item of items) {
		// Check for empty items
		if (!item) {
			throw new SyntaxError('Empty field segment');
		}

		// Process item with optional step
		const stepParts = item.split('/');
		if (stepParts.length > 2) {
			throw new SyntaxError('Invalid step syntax');
		}

		// Parse step value
		let step = 1;
		if (stepParts.length === 2) {
			if (!/^\d+$/.test(stepParts[1])) {
				throw new SyntaxError('Step must be a positive integer');
			}
			step = Number(stepParts[1]);
			if (step <= 0) {
				throw new SyntaxError('Step must be a positive integer');
			}
		}

		const base = stepParts[0];
		let start: number;
		let end: number;

		if (base === '*') {
			// Wildcard: expand from min to max
			start = min;
			end = max;
		} else {
			// Check for invalid characters (anything not digit, dash, or already checked slash)
			if (!/^[\d\-]+$/.test(base)) {
				throw new SyntaxError('Invalid character in field');
			}

			// Parse range or single number
			const rangeParts = base.split('-');

			if (rangeParts.length === 1) {
				// Single number
				if (!/^\d+$/.test(rangeParts[0])) {
					throw new SyntaxError('Invalid number format');
				}
				const num = Number(rangeParts[0]);
				if (num < min || num > max) {
					throw new RangeError('Number outside valid range');
				}
				start = num;
				end = num;
			} else if (rangeParts.length === 2) {
				// Range a-b
				// Check for negative number pattern (e.g., "-5" would split as ["", "5"])
				if (rangeParts[0] === '') {
					throw new SyntaxError('Invalid range format');
				}
				if (!/^\d+$/.test(rangeParts[0]) || !/^\d+$/.test(rangeParts[1])) {
					throw new SyntaxError('Invalid range format');
				}
				start = Number(rangeParts[0]);
				end = Number(rangeParts[1]);

				if (start < min || start > max) {
					throw new RangeError('Range start outside valid range');
				}
				if (end < min || end > max) {
					throw new RangeError('Range end outside valid range');
				}
				if (start > end) {
					throw new RangeError('Range start greater than end');
				}
			} else {
				// More than 2 parts (multiple dashes)
				throw new SyntaxError('Invalid range format');
			}
		}

		// Add all values in range with step
		for (let value = start; value <= end; value += step) {
			values.add(value);
		}
	}

	// Return sorted array of unique values
	return Array.from(values).sort((a, b) => a - b);
}

export { parseCronField };