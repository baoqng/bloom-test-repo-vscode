// bloom-deps:

export function parseRetryAfter(header: unknown, nowMs: number): number | null {
  // Guard: reject non-string types (except null/undefined which return null)
  if (header === null || header === undefined) {
    return null;
  }
  if (typeof header !== 'string') {
    throw new TypeError('header must be a string');
  }

  // Trim and check for empty string
  const trimmed = header.trim();
  if (trimmed === '') {
    return null;
  }

  // Check if trimmed string consists only of ASCII digits
  if (/^\d+$/.test(trimmed)) {
    const delaySeconds = parseInt(trimmed, 10);
    return delaySeconds * 1000;
  }

  // Reject negative numbers and decimals ONLY if they are numeric-looking
  // but don't match the pure digit format. Valid ISO dates may contain
  // hyphens and dots, so we need to be more specific.
  if (/^-\d/.test(trimmed) || /^\d+\.\d+/.test(trimmed)) {
    throw new SyntaxError(`Invalid retry-after value: ${trimmed}`);
  }

  // Not all digits — parse as HTTP-date using Date.parse
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new SyntaxError(`Invalid date string: ${trimmed}`);
  }

  return Math.max(0, parsed - nowMs);
}