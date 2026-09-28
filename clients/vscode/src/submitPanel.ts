// bloom-deps:

export function truncateRequirement(text: string, maxLength: number): string {
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }
  if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || !Number.isInteger(maxLength)) {
    throw new TypeError('maxLength must be a finite integer');
  }
  if (maxLength < 10) {
    throw new RangeError('maxLength must be at least 10');
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength (but reserve 3 chars for '...')
  const lastSpace = text.lastIndexOf(' ', maxLength - 3);

  if (lastSpace > 0) {
    return text.substring(0, lastSpace) + '...';
  } else {
    return text.substring(0, maxLength - 3) + '...';
  }
}