// bloom-deps:

export function expandTemplate(template: unknown, vars: Record<string, unknown>): string {
  if (typeof template !== 'string') {
    throw new TypeError('template must be a string');
  }

  const result: string[] = [];
  let i = 0;
  const len = template.length;

  while (i < len) {
    const ch = template[i];

    if (ch === '}') {
      throw new SyntaxError('Stray closing brace "}" in template');
    }

    if (ch === '{') {
      const closeIdx = template.indexOf('}', i + 1);
      if (closeIdx === -1) {
        throw new SyntaxError('Unclosed "{" in template');
      }

      const inner = template.slice(i + 1, closeIdx);

      if (inner.length === 0) {
        throw new SyntaxError('Empty expression "{}" in template');
      }

      // Detect operator
      let operator = '';
      let varListStr = inner;
      if (inner[0] === '+' || inner[0] === '#') {
        operator = inner[0];
        varListStr = inner.slice(1);
        if (varListStr.length === 0) {
          throw new SyntaxError('Empty expression after operator in template');
        }
      }

      const varNames = varListStr.split(',');

      // Validate variable names
      const validVarName = /^[A-Za-z0-9_]+$/;
      for (const name of varNames) {
        if (!validVarName.test(name)) {
          throw new SyntaxError(`Invalid variable name: "${name}"`);
        }
      }

      // Expand variables
      const parts: string[] = [];
      for (const name of varNames) {
        const value = vars[name];
        if (value === undefined || value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          throw new TypeError(`Variable "${name}" is an array; arrays are not supported`);
        }
        if (typeof value === 'object') {
          throw new TypeError(`Variable "${name}" is an object; objects are not supported`);
        }

        const strValue = String(value);
        let encoded: string;
        if (operator === '+' || operator === '#') {
          encoded = encodeReserved(strValue);
        } else {
          encoded = encodeSimple(strValue);
        }
        parts.push(encoded);
      }

      if (parts.length === 0) {
        // All variables skipped — expand to empty string, no prefix
        result.push('');
      } else {
        const joined = parts.join(',');
        if (operator === '#') {
          result.push('#' + joined);
        } else {
          result.push(joined);
        }
      }

      i = closeIdx + 1;
    } else {
      result.push(ch);
      i++;
    }
  }

  return result.join('');
}

// Unreserved characters per RFC 3986: A-Z a-z 0-9 - . _ ~
const UNRESERVED = /^[A-Za-z0-9\-._~]$/;

// Reserved characters per RFC 6570: :/?#[]@!$&'()*+,;=
const RESERVED = /^[:/?#\[\]@!$&'()*+,;=]$/;

// Valid %XX triplet
const PCT_ENCODED = /^%[0-9A-Fa-f]{2}/;

function encodeSimple(value: string): string {
  // Percent-encode everything except unreserved characters
  // Non-ASCII: encode as UTF-8 bytes
  const bytes = encodeToUtf8Bytes(value);
  let result = '';
  for (const byte of bytes) {
    const ch = String.fromCharCode(byte);
    if (UNRESERVED.test(ch)) {
      result += ch;
    } else {
      result += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return result;
}

function encodeReserved(value: string): string {
  // Leave unreserved and reserved characters unencoded
  // Also leave existing valid %XX triplets unencoded
  // Non-ASCII: encode as UTF-8 bytes
  let result = '';
  let i = 0;

  // We need to process character by character but handle %XX pass-through
  // First, let's work with the string as-is for ASCII and encode non-ASCII
  const chars = splitToCodePoints(value);

  for (let ci = 0; ci < chars.length; ci++) {
    const ch = chars[ci];
    const codePoint = ch.codePointAt(0)!;

    if (codePoint > 127) {
      // Non-ASCII: encode as UTF-8
      const utf8 = encodeCodePointToUtf8Bytes(codePoint);
      for (const byte of utf8) {
        result += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
      }
    } else if (ch === '%' && ci + 2 < chars.length) {
      // Check if it's a valid %XX triplet
      const next2 = chars[ci + 1] + chars[ci + 2];
      if (/^[0-9A-Fa-f]{2}$/.test(next2)) {
        // Pass through the %XX as-is (uppercase)
        result += '%' + next2.toUpperCase();
        ci += 2;
      } else {
        // Not a valid triplet, encode the %
        result += '%25';
      }
    } else if (UNRESERVED.test(ch) || RESERVED.test(ch)) {
      result += ch;
    } else {
      const byte = codePoint;
      result += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }

  return result;
}

function splitToCodePoints(str: string): string[] {
  // Split string into individual Unicode code point strings
  return [...str];
}

function encodeToUtf8Bytes(value: string): number[] {
  const result: number[] = [];
  for (const ch of splitToCodePoints(value)) {
    const codePoint = ch.codePointAt(0)!;
    const bytes = encodeCodePointToUtf8Bytes(codePoint);
    for (const b of bytes) {
      result.push(b);
    }
  }
  return result;
}

function encodeCodePointToUtf8Bytes(codePoint: number): number[] {
  if (codePoint <= 0x7F) {
    return [codePoint];
  } else if (codePoint <= 0x7FF) {
    return [
      0xC0 | (codePoint >> 6),
      0x80 | (codePoint & 0x3F)
    ];
  } else if (codePoint <= 0xFFFF) {
    return [
      0xE0 | (codePoint >> 12),
      0x80 | ((codePoint >> 6) & 0x3F),
      0x80 | (codePoint & 0x3F)
    ];
  } else {
    return [
      0xF0 | (codePoint >> 18),
      0x80 | ((codePoint >> 12) & 0x3F),
      0x80 | ((codePoint >> 6) & 0x3F),
      0x80 | (codePoint & 0x3F)
    ];
  }
}