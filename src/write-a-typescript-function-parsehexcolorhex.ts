// bloom-deps:

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  if (typeof hex !== 'string') {
    throw new TypeError('invalid hex color');
  }

  const shortPattern = /^#([0-9a-fA-F]{3})$/;
  const longPattern = /^#([0-9a-fA-F]{6})$/;

  const shortMatch = hex.match(shortPattern);
  if (shortMatch) {
    const digits = shortMatch[1];
    const r = parseInt(digits[0] + digits[0], 16);
    const g = parseInt(digits[1] + digits[1], 16);
    const b = parseInt(digits[2] + digits[2], 16);
    return { r, g, b };
  }

  const longMatch = hex.match(longPattern);
  if (longMatch) {
    const digits = longMatch[1];
    const r = parseInt(digits.slice(0, 2), 16);
    const g = parseInt(digits.slice(2, 4), 16);
    const b = parseInt(digits.slice(4, 6), 16);
    return { r, g, b };
  }

  throw new TypeError('invalid hex color');
}