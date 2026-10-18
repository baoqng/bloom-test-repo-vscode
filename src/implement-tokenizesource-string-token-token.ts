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
    // Skip whitespace
    if (/[ \t\r\n]/.test(source[pos])) {
      pos++;
      continue;
    }

    const ch = source[pos];

    // STRING: double-quoted with escape sequences
    if (ch === '"') {
      const start = pos;
      pos++; // skip opening quote
      let value = '"';
      let closed = false;

      while (pos < source.length) {
        const c = source[pos];
        if (c === '"') {
          closed = true;
          pos++;
          value += '"';
          break;
        } else if (c === '\\' && pos + 1 < source.length) {
          const next = source[pos + 1];
          if (next === '"') {
            value += '\\"';
            pos += 2;
          } else if (next === '\\') {
            value += '\\\\';
            pos += 2;
          } else if (next === 'n') {
            value += '\\n';
            pos += 2;
          } else if (next === 't') {
            value += '\\t';
            pos += 2;
          } else {
            value += c;
            pos++;
          }
        } else {
          value += c;
          pos++;
        }
      }

      if (!closed) {
        throw new SyntaxError(`Unterminated string at position ${start}`);
      }

      tokens.push({ type: 'STRING', value, start, end: pos });
      continue;
    }

    // Check if minus should be part of a number or treated as operator
    if (ch === '-') {
      const canBeNegative =
        tokens.length === 0 ||
        tokens[tokens.length - 1].type === 'OP' ||
        tokens[tokens.length - 1].type === 'LPAREN' ||
        tokens[tokens.length - 1].type === 'COMMA';

      if (canBeNegative) {
        // Try to match a negative number
        const numberMatch = source.slice(pos).match(/^-(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (numberMatch && numberMatch[0].length > 1) {
          const value = numberMatch[0];
          tokens.push({ type: 'NUMBER', value, start: pos, end: pos + value.length });
          pos += value.length;
          continue;
        }
      }

      // minus is an operator
      tokens.push({ type: 'OP', value: '-', start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // NUMBER: digits with optional decimal, optional exponent (no leading minus here)
    const numberMatch = source.slice(pos).match(/^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (numberMatch && numberMatch[0].length > 0) {
      const value = numberMatch[0];
      tokens.push({ type: 'NUMBER', value, start: pos, end: pos + value.length });
      pos += value.length;
      continue;
    }

    // LPAREN
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // RPAREN
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // COMMA
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // OP: longest match wins
    const twoCharOp = source.slice(pos, pos + 2);
    if (['**', '==', '!=', '<=', '>=', '&&', '||'].includes(twoCharOp)) {
      tokens.push({ type: 'OP', value: twoCharOp, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (['+', '*', '/', '%', '<', '>', '!', '='].includes(ch)) {
      tokens.push({ type: 'OP', value: ch, start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    // IDENT: [A-Za-z_][A-Za-z0-9_]*
    const identMatch = source.slice(pos).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identMatch) {
      const value = identMatch[0];
      tokens.push({ type: 'IDENT', value, start: pos, end: pos + value.length });
      pos += value.length;
      continue;
    }

    // Unrecognised character
    throw new SyntaxError(`Unexpected character '${ch}' at position ${pos}`);
  }

  // EOF token
  tokens.push({ type: 'EOF', value: '', start: source.length, end: source.length });

  return tokens;
}