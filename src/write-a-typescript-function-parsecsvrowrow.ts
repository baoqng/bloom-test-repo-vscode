// bloom-deps:

function parseCSVRow(row: string, options?: { delimiter?: string; trimFields?: boolean }): string[] {
	// Validate input type
	if (typeof row !== 'string') {
		throw new TypeError('row must be a string');
	}

	// Validate and set delimiter
	const delimiter = options?.delimiter ?? ',';
	if (typeof delimiter !== 'string' || delimiter.length !== 1) {
		throw new TypeError('delimiter must be a single character');
	}

	const trimFields = options?.trimFields ?? false;
	const fields: string[] = [];
	let pos = 0;

	while (pos <= row.length) {
		// If we're at the end of the string, add empty field if preceded by delimiter
		if (pos === row.length) {
			// Only add final empty field if we ended with a delimiter
			if (fields.length === 0 || row[pos - 1] === delimiter) {
				fields.push('');
			}
			break;
		}

		const char = row[pos];

		if (char === '"') {
			// Parse quoted field
			let value = '';
			pos++; // Skip opening quote

			while (pos < row.length) {
				if (row[pos] === '"') {
					// Check for escaped quote (doubled double-quote)
					if (pos + 1 < row.length && row[pos + 1] === '"') {
						value += '"';
						pos += 2;
					} else {
						// End of quoted field
						pos++; // Move past closing quote
						break;
					}
				} else {
					value += row[pos];
					pos++;
				}
			}

			// Check if quote was properly terminated
			if (pos - 1 >= row.length || row[pos - 1] !== '"') {
				throw new SyntaxError('unterminated quoted field');
			}

			// Check for unexpected character after closing quote
			if (pos < row.length && row[pos] !== delimiter) {
				throw new SyntaxError('unexpected character after closing quote');
			}

			fields.push(value);

			// Skip delimiter if present
			if (pos < row.length && row[pos] === delimiter) {
				pos++;
			}
		} else {
			// Parse unquoted field
			let value = '';
			const startPos = pos;

			while (pos < row.length && row[pos] !== delimiter) {
				value += row[pos];
				pos++;
			}

			// Apply trimFields only to unquoted fields
			if (trimFields) {
				value = value.trim();
			}

			fields.push(value);

			// Skip delimiter if present
			if (pos < row.length && row[pos] === delimiter) {
				pos++;
			}
		}
	}

	return fields;
}

export { parseCSVRow };