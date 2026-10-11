// bloom-deps:

export function parseRetryAfter(header: unknown, nowMs: number): number | null {
  if (header === null || header === undefined) {
    return null;
  }

  if (typeof header !== 'string') {
    throw new TypeError('header must be a string, null, or undefined');
  }

  const trimmed = header.trim();

  if (trimmed === '') {
    return null;
  }

  // Check if it consists only of ASCII digits (no sign, no decimal point)
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return seconds * 1000;
  }

  // Reject negative numbers before attempting Date.parse
  if (/^-/.test(trimmed)) {
    throw new SyntaxError(`Invalid Retry-After header value: "${trimmed}"`);
  }

  // Reject decimal numbers (digit.digit pattern) before attempting Date.parse
  if (/^\d+\.\d+$/.test(trimmed)) {
    throw new SyntaxError(`Invalid Retry-After header value: "${trimmed}"`);
  }

  // Otherwise, try to parse as an HTTP date
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) {
    throw new SyntaxError(`Invalid Retry-After header value: "${trimmed}"`);
  }

  return Math.max(0, parsed - nowMs);
}