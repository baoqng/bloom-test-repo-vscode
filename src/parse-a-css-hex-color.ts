// bloom-deps:

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string' || hex.length === 0) {
    return null;
  }

  if (hex[0] !== '#') {
    return null;
  }

  const body = hex.slice(1);

  if (body.length !== 3 && body.length !== 6) {
    return null;
  }

  if (!/^[0-9a-fA-F]+$/.test(body)) {
    return null;
  }

  if (body.length === 3) {
    const r = parseInt(body[0], 16);
    const g = parseInt(body[1], 16);
    const b = parseInt(body[2], 16);
    return {
      r: r * 0x11,
      g: g * 0x11,
      b: b * 0x11,
    };
  }

  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  };
}