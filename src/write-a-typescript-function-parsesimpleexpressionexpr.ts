// bloom-deps:

export function parseSimpleExpression(expr: string): number {
  if (typeof expr !== 'string') {
    throw new TypeError('expression must be a string');
  }

  const stripped = expr.replace(/\s+/g, '');

  if (stripped.length === 0) {
    throw new SyntaxError('empty expression');
  }

  // Validate characters: only digits, +, -, *, /, (, )
  for (const ch of stripped) {
    if (!/[\d+\-*/()]/.test(ch)) {
      throw new SyntaxError(`unexpected token: ${ch}`);
    }
  }

  let pos = 0;

  function peek(): string | undefined {
    return stripped[pos];
  }

  function consume(): string {
    return stripped[pos++];
  }

  function parseExpression(): number {
    return parseAddSub();
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (pos < stripped.length && (peek() === '+' || peek() === '-')) {
      const op = consume();
      const right = parseMulDiv();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePrimary();
    while (pos < stripped.length && (peek() === '*' || peek() === '/')) {
      const op = consume();
      const right = parsePrimary();
      if (op === '*') {
        left = left * right;
      } else {
        if (right === 0) {
          throw new RangeError('division by zero');
        }
        // Truncate toward zero
        left = Math.trunc(left / right);
      }
    }
    return left;
  }

  function parsePrimary(): number {
    const ch = peek();

    if (ch === undefined) {
      throw new SyntaxError('unexpected end of expression');
    }

    if (ch === '(') {
      consume(); // consume '('
      const val = parseExpression();
      if (peek() !== ')') {
        throw new SyntaxError('unmatched parenthesis');
      }
      consume(); // consume ')'
      return val;
    }

    // Unary minus check: reject leading '-'
    if (ch === '-') {
      throw new SyntaxError(`unexpected token: -`);
    }

    if (/\d/.test(ch)) {
      let numStr = '';
      while (pos < stripped.length && /\d/.test(stripped[pos])) {
        numStr += stripped[pos++];
      }
      return parseInt(numStr, 10);
    }

    throw new SyntaxError(`unexpected token: ${ch}`);
  }

  const result = parseExpression();

  // Check for leftover characters (e.g., unmatched closing paren)
  if (pos < stripped.length) {
    const leftover = stripped[pos];
    if (leftover === ')') {
      throw new SyntaxError('unmatched parenthesis');
    }
    throw new SyntaxError(`unexpected token: ${leftover}`);
  }

  return result;
}