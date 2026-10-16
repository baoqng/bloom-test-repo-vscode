// bloom-deps:

export function parseIntSafe(s: string): number {
  if (typeof s !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof s}`);
  }

  if (!/^[+-]?\d+$/.test(s)) {
    throw new RangeError(`Invalid integer string: "${s}"`);
  }

  const result = Number(s);

  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`Value is not a safe integer: "${s}"`);
  }

  return result;
}