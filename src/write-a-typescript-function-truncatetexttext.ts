// bloom-deps:

function truncateText(text: unknown, maxCodePoints: unknown, ellipsis: string = '…'): string {
  // Input validation
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }
  
  if (typeof ellipsis !== 'string') {
    throw new TypeError('ellipsis must be a string');
  }
  
  // Validate maxCodePoints
  if (
    typeof maxCodePoints !== 'number' ||
    !Number.isInteger(maxCodePoints) ||
    maxCodePoints < 0 ||
    !Number.isSafeInteger(maxCodePoints)
  ) {
    throw new RangeError('maxCodePoints must be a non-negative safe integer');
  }
  
  // Count code points in ellipsis
  const ellipsisCodePoints = Array.from(ellipsis).length;
  
  // Check if ellipsis alone exceeds maxCodePoints
  if (ellipsisCodePoints > maxCodePoints) {
    throw new RangeError('ellipsis alone has more code points than maxCodePoints');
  }
  
  // Count code points in text
  const textCodePoints = Array.from(text).length;
  
  // If text fits within maxCodePoints, return unchanged
  if (textCodePoints <= maxCodePoints) {
    return text;
  }
  
  // Calculate how many code points we can take from text
  const availableCodePoints = maxCodePoints - ellipsisCodePoints;
  
  // Take the prefix of text up to availableCodePoints
  const textArray = Array.from(text);
  const prefix = textArray.slice(0, availableCodePoints).join('');
  
  return prefix + ellipsis;
}

export { truncateText };