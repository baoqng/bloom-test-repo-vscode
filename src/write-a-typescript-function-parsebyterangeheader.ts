// bloom-deps:

export function parseByteRange(header: unknown, size: number): { start: number; end: number } {
  // Validate header type
  if (typeof header !== 'string') {
    throw new TypeError('header must be a string');
  }

  // Validate size
  if (
    typeof size !== 'number' ||
    !Number.isFinite(size) ||
    !Number.isSafeInteger(size) ||
    size < 0
  ) {
    throw new RangeError('size must be a non-negative safe integer');
  }

  // Validate prefix
  if (!header.startsWith('bytes=')) {
    throw new SyntaxError('Range header must start with "bytes="');
  }

  const spec = header.slice('bytes='.length);

  // Reject multiple ranges (commas)
  if (spec.includes(',')) {
    throw new SyntaxError('Multiple ranges are not supported');
  }

  // Try A-B pattern
  const abMatch = spec.match(/^(\d+)-(\d+)$/);
  if (abMatch) {
    const a = parseInt(abMatch[1], 10);
    const b = parseInt(abMatch[2], 10);

    if (a > b) {
      throw new SyntaxError(`Range start (${a}) must not be greater than end (${b})`);
    }

    if (size === 0) {
      throw new RangeError('Resource has zero size; range is unsatisfiable');
    }

    if (a >= size) {
      throw new RangeError(`Range start (${a}) is beyond resource size (${size})`);
    }

    const clampedB = Math.min(b, size - 1);
    return { start: a, end: clampedB };
  }

  // Try A- pattern
  const aToEndMatch = spec.match(/^(\d+)-$/);
  if (aToEndMatch) {
    const a = parseInt(aToEndMatch[1], 10);

    if (size === 0) {
      throw new RangeError('Resource has zero size; range is unsatisfiable');
    }

    if (a >= size) {
      throw new RangeError(`Range start (${a}) is beyond resource size (${size})`);
    }

    return { start: a, end: size - 1 };
  }

  // Try -N pattern
  const suffixMatch = spec.match(/^-(\d+)$/);
  if (suffixMatch) {
    const n = parseInt(suffixMatch[1], 10);

    if (n === 0) {
      throw new RangeError('Suffix length N must not be zero');
    }

    if (size === 0) {
      throw new RangeError('Resource has zero size; range is unsatisfiable');
    }

    if (n >= size) {
      return { start: 0, end: size - 1 };
    }

    return { start: size - n, end: size - 1 };
  }

  // No pattern matched
  throw new SyntaxError(`Unsupported range spec: "${spec}"`);
}