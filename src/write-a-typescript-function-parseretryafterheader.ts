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

  // Check if trimmed consists only of ASCII digits (no sign, no decimal point)
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return seconds * 1000;
  }

  // Reject strings that look like numbers but aren't pure ASCII digits
  // This includes negative numbers, decimals, and numbers with signs
  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    throw new SyntaxError(`Invalid Retry-After header value: "${header}"`);
  }

  // Otherwise, attempt to parse as an HTTP date
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) {
    throw new SyntaxError(`Invalid Retry-After header value: "${header}"`);
  }

  return Math.max(0, parsed - nowMs);
}