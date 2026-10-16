// bloom-deps:

type TokenType = 'NUMBER' | 'STRING' | 'IDENT' | 'OP' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  // Helper: check if a character can precede a negative sign
  function canPrecedeNegative(lastToken: Token | null): boolean {
    if (!lastToken) return true; // start of input
    return (
      lastToken.type === 'OP' ||
      lastToken.type === 'LPAREN' ||
      lastToken.type === 'COMMA'
    );
  }

  // Helper: skip whitespace
  function skipWhitespace(): void {
    while (pos < source.length) {
      const ch = source[pos];
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        pos++;
      } else {
        break;
      }
    }
  }

  // Helper: try to match a number
  function tryNumber(): Token | null {
    const start = pos;
    let match = '';

    // Check for optional negative sign
    if (source[pos] === '-') {
      // Only consume '-' if it can precede a negative number
      const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      if (!canPrecedeNegative(lastToken)) {
        return null;
      }
      match += '-';
      pos++;
    }

    // Try to match the number pattern: 0|[1-9]\d* optionally followed by .\d+ and/or [eE][+-]?\d+
    const numberRegex = /^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
    const remaining = source.slice(pos);
    const numberMatch = remaining.match(numberRegex);

    if (!numberMatch) {
      // If we consumed a '-' but found no number, backtrack
      if (match === '-') {
        pos = start;
        return null;
      }
      return null;
    }

    match += numberMatch[0];
    pos += numberMatch[0].length;

    return {
      type: 'NUMBER',
      value: match,
      start,
      end: pos,
    };
  }

  // Helper: try to match a string
  function tryString(): Token | null {
    if (source[pos] !== '"') {
      return null;
    }

    const start = pos;
    pos++; // consume opening quote
    let value = '';

    while (pos < source.length) {
      const ch = source[pos];

      if (ch === '"') {
        pos++; // consume closing quote
        return {
          type: 'STRING',
          value: `"${value}"`,
          start,
          end: pos,
        };
      }

      if (ch === '\\' && pos + 1 < source.length) {
        const next = source[pos + 1];
        if (next === '"' || next === '\\' || next === 'n' || next === 't') {
          if (next === 'n') {
            value += '\n';
          } else if (next === 't') {
            value += '\t';
          } else if (next === '"') {
            value += '\\"';
          } else if (next === '\\') {
            value += '\\\\';
          }
          pos += 2;
        } else {
          value += ch;
          pos++;
        }
      } else {
        value += ch;
        pos++;
      }
    }

    // Unterminated string
    throw new SyntaxError(`Unterminated string starting at position ${start}`);
  }

  // Helper: try to match an identifier
  function tryIdent(): Token | null {
    if (!/[A-Za-z_]/.test(source[pos])) {
      return null;
    }

    const start = pos;
    while (pos < source.length && /[A-Za-z0-9_]/.test(source[pos])) {
      pos++;
    }

    return {
      type: 'IDENT',
      value: source.slice(start, pos),
      start,
      end: pos,
    };
  }

  // Helper: try to match an operator
  function tryOp(): Token | null {
    const start = pos;
    const twoCharOps = ['**', '==', '!=', '<=', '>=', '&&', '||'];
    const oneCharOps = ['+', '-', '*', '/', '%', '<', '>', '!', '='];

    // Check two-character operators first
    if (pos + 1 < source.length) {
      const twoChar = source.slice(pos, pos + 2);
      if (twoCharOps.includes(twoChar)) {
        pos += 2;
        return {
          type: 'OP',
          value: twoChar,
          start,
          end: pos,
        };
      }
    }

    // Check one-character operators
    if (oneCharOps.includes(source[pos])) {
      const ch = source[pos];
      pos++;
      return {
        type: 'OP',
        value: ch,
        start,
        end: pos,
      };
    }

    return null;
  }

  // Main tokenization loop
  while (pos < source.length) {
    skipWhitespace();

    if (pos >= source.length) {
      break;
    }

    const ch = source[pos];

    // Try to match tokens in priority order
    let token: Token | null = null;

    // NUMBER (including negative numbers)
    token = tryNumber();
    if (token) {
      tokens.push(token);
      continue;
    }

    // STRING
    token = tryString();
    if (token) {
      tokens.push(token);
      continue;
    }

    // IDENT
    token = tryIdent();
    if (token) {
      tokens.push(token);
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

    // OP
    token = tryOp();
    if (token) {
      tokens.push(token);
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