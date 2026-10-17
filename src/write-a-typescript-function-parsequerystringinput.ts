// bloom-deps:

export function parseQueryString(input: string): Record<string, string | string[]> {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  let normalized = input;
  if (normalized.startsWith('?')) {
    normalized = normalized.slice(1);
  }

  if (normalized === '') {
    return {};
  }

  const result: Record<string, string | string[]> = {};
  const pairs = normalized.split('&');

  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    let rawKey: string;
    let rawValue: string;

    if (eqIndex === -1) {
      rawKey = pair;
      rawValue = '';
    } else {
      rawKey = pair.slice(0, eqIndex);
      rawValue = pair.slice(eqIndex + 1);
    }

    let key: string;
    let value: string;

    try {
      key = decodeURIComponent(rawKey);
    } catch {
      throw new URIError('Invalid percent-encoding in query string');
    }

    try {
      value = decodeURIComponent(rawValue);
    } catch {
      throw new URIError('Invalid percent-encoding in query string');
    }

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}