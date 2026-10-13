// bloom-deps:

export function resolvePointer(document: unknown, pointer: unknown): unknown {
  if (typeof pointer !== 'string') {
    throw new TypeError('pointer must be a string');
  }

  if (pointer === '') {
    return document;
  }

  if (!pointer.startsWith('/')) {
    throw new SyntaxError('JSON Pointer must be the empty string or start with "/"');
  }

  const rawTokens = pointer.slice(1).split('/');

  const tokens = rawTokens.map((raw) => {
    // Validate escape sequences: '~' must be followed by '0' or '1'
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '~') {
        if (i + 1 >= raw.length || (raw[i + 1] !== '0' && raw[i + 1] !== '1')) {
          throw new SyntaxError(`Invalid escape sequence in token: "${raw}"`);
        }
      }
    }
    // Unescape: replace '~1' with '/' first, then '~0' with '~'
    return raw.replace(/~1/g, '/').replace(/~0/g, '~');
  });

  let current: unknown = document;

  for (const token of tokens) {
    if (current === null || typeof current !== 'object') {
      throw new RangeError(
        `Cannot descend into primitive or null value with token "${token}"`
      );
    }

    if (Array.isArray(current)) {
      if (token === '-') {
        throw new RangeError('Token "-" is not a valid array index for resolvePointer');
      }

      // Must be a non-negative integer without leading zeros
      if (!/^(0|[1-9]\d*)$/.test(token)) {
        throw new RangeError(`Invalid array index token: "${token}"`);
      }

      const index = parseInt(token, 10);

      if (index >= current.length) {
        throw new RangeError(
          `Array index ${index} is out of bounds (length ${current.length})`
        );
      }

      current = current[index];
    } else {
      // Plain object
      const obj = current as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(obj, token)) {
        throw new RangeError(`Object does not have own property "${token}"`);
      }
      current = obj[token];
    }
  }

  return current;
}