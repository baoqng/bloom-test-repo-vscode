export function escapeShellArg(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError('value must be a string');
  }
  if (value.includes('\u0000')) {
    throw new RangeError('value must not contain a NUL character (\\u0000)');
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}