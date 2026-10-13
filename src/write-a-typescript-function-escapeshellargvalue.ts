// bloom-deps:

/**
 * Escapes a value for safe use as one argument in a POSIX sh command line.
 *
 * @param value - The value to escape (must be a string)
 * @returns The value wrapped in single quotes with internal quotes escaped
 * @throws TypeError if value is not a string
 * @throws RangeError if the string contains a NUL character (\u0000)
 */
function escapeShellArg(value: unknown): string {
  // [MANDATORY] Throw TypeError if value is not a string
  if (typeof value !== 'string') {
    throw new TypeError('escapeShellArg: value must be a string');
  }

  // [MANDATORY] Throw RangeError if the string contains a NUL character
  if (value.includes('\u0000')) {
    throw new RangeError('escapeShellArg: string cannot contain NUL character');
  }

  // Replace every single quote with the four-character sequence '\''
  // (close quote, escaped quote, reopen quote)
  const escaped = value.replace(/'/g, `'\\'\'`);

  // Wrap the entire value in single quotes
  return `'${escaped}'`;
}

export { escapeShellArg };