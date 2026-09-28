// bloom-deps:

export function truncateRequirement(text: string, maxLength: number): string {
  // Validate text parameter
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }

  // Validate maxLength parameter
  if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || !Number.isInteger(maxLength)) {
    throw new TypeError('maxLength must be a finite integer');
  }

  // Check minimum length constraint
  if (maxLength < 10) {
    throw new RangeError('maxLength must be at least 10');
  }

  // Return unchanged if within limit
  if (text.length <= maxLength) {
    return text;
  }

  // Try to find a word boundary (space) before maxLength
  const lastSpace = text.lastIndexOf(' ', maxLength - 1);

  if (lastSpace > 0) {
    // Found a space before maxLength, truncate at the space
    return text.substring(0, lastSpace) + '...';
  } else {
    // No space found, hard truncate at maxLength - 3
    return text.substring(0, maxLength - 3) + '...';
  }
}