// bloom-deps:

function parseSimpleExpression(expr: string): number {
	if (typeof expr !== 'string') {
		throw new TypeError('expression must be a string');
	}

	const trimmed = expr.replace(/\s+/g, '');

	if (trimmed.length === 0) {
		throw new SyntaxError('empty expression');
	}

	if (/^-\d/.test(trimmed)) {
		throw new SyntaxError('unexpected token: -');
	}

	let position = 0;

	const peek = (): string | null => {
		return position < trimmed.length ? trimmed[position] : null;
	};

	const advance = (): void => {
		position++;
	};

	const parseNumber = (): number => {
		let numStr = '';
		while (position < trimmed.length && /\d/.test(trimmed[position])) {
			numStr += trimmed[position];
			advance();
		}
		return parseInt(numStr, 10);
	};

	const parseAtom = (): number => {
		const char = peek();

		if (char === '(') {
			advance();
			const result = parseAddition();
			if (peek() !== ')') {
				throw new SyntaxError('unmatched parenthesis');
			}
			advance();
			return result;
		}

		if (char !== null && /\d/.test(char)) {
			return parseNumber();
		}

		if (char === null) {
			throw new SyntaxError('unexpected end of expression');
		}

		throw new SyntaxError(`unexpected token: ${char}`);
	};

	const parseMultiplication = (): number => {
		let result = parseAtom();

		while (peek() === '*' || peek() === '/') {
			const operator = peek();
			advance();

			const right = parseAtom();

			if (operator === '*') {
				result = result * right;
			} else {
				if (right === 0) {
					throw new RangeError('division by zero');
				}
				result = Math.trunc(result / right);
			}
		}

		return result;
	};

	const parseAddition = (): number => {
		let result = parseMultiplication();

		while (peek() === '+' || peek() === '-') {
			const operator = peek();
			advance();

			const right = parseMultiplication();

			if (operator === '+') {
				result = result + right;
			} else {
				result = result - right;
			}
		}

		return result;
	};

	const result = parseAddition();

	if (position !== trimmed.length) {
		throw new SyntaxError(`unexpected token: ${trimmed[position]}`);
	}

	return result;
}

export { parseSimpleExpression };