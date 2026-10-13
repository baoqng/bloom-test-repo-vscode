// bloom-deps:

export function parseBytes(input: unknown): number {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  const trimmed = input.trim();

  // Regex: non-negative decimal (digits on both sides of dot if dot present), optional single space, optional unit
  const pattern = /^(\d+(?:\.\d+)?)( (?:B|kB|MB|GB|TB|KiB|MiB|GiB|TiB))?$/;
  const match = trimmed.match(pattern);

  if (!match) {
    throw new SyntaxError(`Invalid byte string: "${input}"`);
  }

  const numStr = match[1];
  const unitPart = match[2]; // includes the leading space if present
  const unit = unitPart ? unitPart.trim() : '';

  const value = parseFloat(numStr);

  let multiplier: number;

  switch (unit) {
    case '':
    case 'B':
      multiplier = 1;
      break;
    case 'kB':
      multiplier = 1_000;
      break;
    case 'MB':
      multiplier = 1_000_000;
      break;
    case 'GB':
      multiplier = 1_000_000_000;
      break;
    case 'TB':
      multiplier = 1_000_000_000_000;
      break;
    case 'KiB':
      multiplier = 1024;
      break;
    case 'MiB':
      multiplier = 1024 ** 2;
      break;
    case 'GiB':
      multiplier = 1024 ** 3;
      break;
    case 'TiB':
      multiplier = 1024 ** 4;
      break;
    default:
      throw new SyntaxError(`Unknown unit: "${unit}"`);
  }

  const product = value * multiplier;

  // For unit B, fractional values are not allowed
  if (unit === 'B' && !Number.isInteger(value)) {
    throw new RangeError(`Fractional byte values are not allowed: "${input}"`);
  }

  // Half-up rounding: Math.floor(x + 0.5)
  const rounded = Math.floor(product + 0.5);

  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError(`Result is not a safe integer: ${rounded}`);
  }

  return rounded;
}