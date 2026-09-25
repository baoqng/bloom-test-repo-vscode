// bloom-deps:

function computeCacheKey(inputs: Record<string, string | number | boolean>): string {
  if (
    inputs === null ||
    typeof inputs !== 'object' ||
    Array.isArray(inputs)
  ) {
    throw new TypeError('inputs must be a plain object');
  }

  const encode = (s: string): string =>
    s.replace(/=/g, '%3D').replace(/\|/g, '%7C');

  const keys = Object.keys(inputs).sort();

  if (keys.length === 0) {
    return '';
  }

  return keys
    .map(key => {
      const encodedKey = encode(key);
      const encodedValue = encode(String(inputs[key]));
      return `${encodedKey}=${encodedValue}`;
    })
    .join('|');
}

export { computeCacheKey };