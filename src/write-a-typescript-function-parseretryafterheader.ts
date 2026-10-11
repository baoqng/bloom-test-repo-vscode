// bloom-deps:

export function parseRetryAfter(header: unknown, nowMs: number): number | null {
  // Guard: null or undefined returns null
  if (header === null || header === undefined) {
    return null;
  }

  // Guard: not a string throws TypeError
  if (typeof header !== 'string') {
    throw new TypeError('header must be a string');
  }

  // Trim and check for empty string
  const trimmed = header.trim();
  if (trimmed === '') {
    return null;
  }

  // Check if it consists only of ASCII digits
  if (/^\d+$/.test(trimmed)) {
    // Interpret as delay-seconds
    const seconds = parseInt(trimmed, 10);
    return seconds * 1000;
  }

  // Reject negative number strings like '-5'
  if (/^-\d/.test(trimmed)) {
    throw new SyntaxError(`Invalid Retry-After header: negative numbers are not allowed`);
  }

  // Reject decimal number strings like '1.5'
  if (/^\d+\.\d/.test(trimmed)) {
    throw new SyntaxError(`Invalid Retry-After header: decimal numbers are not allowed`);
  }

  // Parse as HTTP-date
  const parsed = Date.parse(trimmed);

  // If NaN, throw SyntaxError
  if (isNaN(parsed)) {
    throw new SyntaxError(`Invalid Retry-After header: not a valid date string`);
  }

  // Return the maximum of 0 and (parsed - nowMs)
  return Math.max(0, parsed - nowMs);
}