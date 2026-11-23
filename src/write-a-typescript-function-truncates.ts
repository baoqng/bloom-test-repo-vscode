// bloom-deps:

export function truncate(s: string, maxLen: number): string {
  if (maxLen < 1) {
    throw new RangeError(`maxLen must be at least 1, got ${maxLen}`);
  }
  if (s.length <= maxLen) {
    return s;
  }
  return s.slice(0, maxLen - 1) + '\u2026';
}