// bloom-deps:

export function validateHexColor(hex: string): string {
  if (typeof hex !== 'string') {
    throw new TypeError(`Invalid hex colour: ${hex}`);
  }

  if (hex.length !== 7) {
    throw new TypeError(`Invalid hex colour: ${hex}`);
  }

  if (hex[0] !== '#') {
    throw new TypeError(`Invalid hex colour: ${hex}`);
  }

  const component = hex.slice(1);
  if (!/^[0-9a-fA-F]{6}$/.test(component)) {
    throw new TypeError(`Invalid hex colour: ${hex}`);
  }

  return hex.toLowerCase();
}