// bloom-deps:

export type ParsedQuery = Record<string, string | string[]>;

export function parseQueryString(query: string): ParsedQuery {
  if (typeof query !== 'string') {
    throw new TypeError('query must be a string');
  }

  // Strip leading '?' if present
  let processed = query;
  if (processed.startsWith('?')) {
    processed = processed.slice(1);
  }

  // Return empty object for empty or whitespace-only string
  if (processed.trim() === '') {
    return {};
  }

  // Split on both '&' and ';' separators
  const pairs = processed.split(/[&;]/);

  const result: ParsedQuery = {};
  const keyCount: Record<string, number> = {};

  for (const pair of pairs) {
    // Skip empty pairs
    if (pair === '') {
      continue;
    }

    // Split on first '=' only
    const eqIndex = pair.indexOf('=');
    let key: string;
    let value: string;

    if (eqIndex === -1) {
      // No '=' sign: key is the pair, value is empty string
      key = pair;
      value = '';
    } else {
      key = pair.slice(0, eqIndex);
      value = pair.slice(eqIndex + 1);
    }

    // Percent-decode both key and value
    key = percentDecode(key, false);
    value = percentDecode(value, true);

    // Track key occurrences
    keyCount[key] = (keyCount[key] || 0) + 1;

    // Add to result
    if (keyCount[key] === 1) {
      // First occurrence: store as string
      result[key] = value;
    } else if (keyCount[key] === 2) {
      // Second occurrence: convert to array
      const existing = result[key];
      result[key] = [existing as string, value];
    } else {
      // Subsequent occurrences: append to array
      (result[key] as string[]).push(value);
    }
  }

  return result;
}

/**
 * Percent-decode a string. In values, '+' is also decoded as space.
 * @param str The string to decode
 * @param isValue True if this is a query value (decode '+' as space); false if key
 */
function percentDecode(str: string, isValue: boolean): string {
  // In values, replace '+' with space first
  let processed = str;
  if (isValue) {
    processed = processed.replace(/\+/g, ' ');
  }

  // Percent-decode: %XX → character with code XX
  return processed.replace(/%([0-9A-Fa-f]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}