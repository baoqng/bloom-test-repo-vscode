// bloom-deps:

export type TokenType = 'NUMBER' | 'STRING' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF';

export interface Token {
	type: TokenType;
	value: string;
	start: number;
	end: number;
}

export function tokenize(source: string): Token[] {
	const tokens: Token[] = [];
	let pos = 0;

	while (pos < source.length) {
		const ch = source[pos];

		// Skip whitespace
		if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
			pos++;
			continue;
		}

		// STRING: double-quoted with escape sequences
		if (ch === '"') {
			const start = pos;
			pos++; // skip opening quote
			let value = '';

			while (pos < source.length && source[pos] !== '"') {
				if (source[pos] === '\\' && pos + 1 < source.length) {
					const nextChar = source[pos + 1];
					if (nextChar === '"' || nextChar === '\\' || nextChar === 'n' || nextChar === 't') {
						if (nextChar === 'n') {
							value += '\n';
						} else if (nextChar === 't') {
							value += '\t';
						} else {
							value += nextChar;
						}
						pos += 2;
					} else {
						value += source[pos];
						pos++;
					}
				} else {
					value += source[pos];
					pos++;
				}
			}

			if (pos >= source.length) {
				throw new SyntaxError(`Unterminated string at position ${start}`);
			}

			pos++; // skip closing quote
			tokens.push({
				type: 'STRING',
				value,
				start,
				end: pos,
			});
			continue;
		}

		// LPAREN
		if (ch === '(') {
			tokens.push({
				type: 'LPAREN',
				value: '(',
				start: pos,
				end: pos + 1,
			});
			pos++;
			continue;
		}

		// RPAREN
		if (ch === ')') {
			tokens.push({
				type: 'RPAREN',
				value: ')',
				start: pos,
				end: pos + 1,
			});
			pos++;
			continue;
		}

		// COMMA
		if (ch === ',') {
			tokens.push({
				type: 'COMMA',
				value: ',',
				start: pos,
				end: pos + 1,
			});
			pos++;
			continue;
		}

		// NUMBER: including optional leading negative sign
		if (ch === '-' || ch === '.' || (ch >= '0' && ch <= '9')) {
			// Determine if '-' can start a number
			let canBeNegative = false;
			if (ch === '-') {
				if (tokens.length === 0) {
					canBeNegative = true;
				} else {
					const lastToken = tokens[tokens.length - 1];
					if (
						lastToken.type === 'OP' ||
						lastToken.type === 'LPAREN' ||
						lastToken.type === 'COMMA'
					) {
						canBeNegative = true;
					}
				}
			}

			// Try to match NUMBER pattern
			if (ch === '-' && !canBeNegative) {
				// '-' is not allowed as part of a number here, treat as operator
			} else if (ch === '-' || ch === '.' || (ch >= '0' && ch <= '9')) {
				const numStart = pos;
				const numPattern =
					/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
				const remaining = source.slice(pos);
				const match = remaining.match(numPattern);

				if (match) {
					const value = match[0];
					pos += value.length;
					tokens.push({
						type: 'NUMBER',
						value,
						start: numStart,
						end: pos,
					});
					continue;
				}
			}
		}

		// IDENT
		if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
			const start = pos;
			while (
				pos < source.length &&
				((source[pos] >= 'A' && source[pos] <= 'Z') ||
					(source[pos] >= 'a' && source[pos] <= 'z') ||
					(source[pos] >= '0' && source[pos] <= '9') ||
					source[pos] === '_')
			) {
				pos++;
			}
			const value = source.slice(start, pos);
			tokens.push({
				type: 'IDENT',
				value,
				start,
				end: pos,
			});
			continue;
		}

		// OP: longest match wins
		const opStart = pos;
		let opMatch = '';

		// Try 2-character operators first
		if (pos + 1 < source.length) {
			const twoChar = source.slice(pos, pos + 2);
			if (
				twoChar === '**' ||
				twoChar === '==' ||
				twoChar === '!=' ||
				twoChar === '<=' ||
				twoChar === '>=' ||
				twoChar === '&&' ||
				twoChar === '||'
			) {
				opMatch = twoChar;
				pos += 2;
			}
		}

		// Try 1-character operators if no 2-char match
		if (!opMatch) {
			const oneChar = source[pos];
			if (
				oneChar === '+' ||
				oneChar === '-' ||
				oneChar === '*' ||
				oneChar === '/' ||
				oneChar === '%' ||
				oneChar === '<' ||
				oneChar === '>' ||
				oneChar === '!' ||
				oneChar === '='
			) {
				opMatch = oneChar;
				pos++;
			}
		}

		if (opMatch) {
			tokens.push({
				type: 'OP',
				value: opMatch,
				start: opStart,
				end: pos,
			});
			continue;
		}

		// Unrecognized character
		throw new SyntaxError(`Unexpected character '${ch}' at position ${pos}`);
	}

	// Add EOF token
	tokens.push({
		type: 'EOF',
		value: '',
		start: source.length,
		end: source.length,
	});

	return tokens;
}