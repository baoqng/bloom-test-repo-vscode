// bloom-deps:

export function computeEditorScrollDelta(
  targetLineNumber: number,
  viewportStartLine: number,
  viewportEndLine: number,
  totalLines: number,
  scrollPadding: number
): number {
  // Validate all arguments are finite integers
  for (const [name, val] of [
    ['targetLineNumber', targetLineNumber],
    ['viewportStartLine', viewportStartLine],
    ['viewportEndLine', viewportEndLine],
    ['totalLines', totalLines],
    ['scrollPadding', scrollPadding],
  ] as [string, unknown][]) {
    if (typeof val !== 'number' || !Number.isFinite(val) || !Number.isInteger(val)) {
      throw new TypeError(`${name} must be a finite integer`);
    }
  }

  // Business rule validations
  if (viewportStartLine < 1) {
    throw new RangeError('viewportStartLine must be >= 1');
  }
  if (viewportEndLine <= viewportStartLine) {
    throw new RangeError('viewportEndLine must be greater than viewportStartLine');
  }
  if (totalLines < 1) {
    throw new RangeError('totalLines must be >= 1');
  }
  if (scrollPadding < 0) {
    throw new RangeError('scrollPadding must be >= 0');
  }

  const viewportHeight = viewportEndLine - viewportStartLine;

  // Determine effective padded viewport boundaries
  let paddedStart = viewportStartLine + scrollPadding;
  let paddedEnd = viewportEndLine - scrollPadding;

  // If padded viewport is invalid (padding too large), fall back to unpadded viewport
  if (paddedStart >= paddedEnd) {
    paddedStart = viewportStartLine;
    paddedEnd = viewportEndLine;
  }

  let delta: number;

  if (targetLineNumber < paddedStart) {
    // Target is above the padded viewport — scroll up (negative delta)
    delta = targetLineNumber - paddedStart;
  } else if (targetLineNumber > paddedEnd) {
    // Target is below the padded viewport — scroll down (positive delta)
    delta = targetLineNumber - paddedEnd;
  } else {
    // Target is within the padded viewport
    return 0;
  }

  // Clamp so viewport start never goes below 1 and never above totalLines
  const newViewportStart = viewportStartLine + delta;
  const clampedViewportStart = Math.min(Math.max(newViewportStart, 1), totalLines);
  const clampedDelta = clampedViewportStart - viewportStartLine;

  return clampedDelta;
}