// bloom-deps:

export function parseCacheControl(header: unknown): Record<string, true | number | string> {
  if (typeof header !== 'string') {
    throw new TypeError('header must be a string');
  }

  const trimmed = header.trim();
  if (trimmed === '') {
    return {};
  }

  const result: Record<string, true | number | string> = {};
  const parts = header.split(',');

  for (const part of parts) {
    const directive = part.trim();

    if (directive === '') {
      throw new SyntaxError('Empty directive encountered (e.g. consecutive commas or trailing comma)');
    }

    const eqIndex = directive.indexOf('=');

    let name: string;
    let rawValue: string | undefined;

    if (eqIndex === -1) {
      name = directive.toLowerCase();
      rawValue = undefined;
    } else {
      name = directive.slice(0, eqIndex).trim().toLowerCase();
      rawValue = directive.slice(eqIndex + 1).trim();
    }

    if (name in result) {
      throw new SyntaxError(`Repeated directive: ${name}`);
    }

    if (rawValue === undefined) {
      result[name] = true;
      continue;
    }

    if (name === 'max-age' || name === 's-maxage') {
      if (!/^\d+$/.test(rawValue)) {
        throw new SyntaxError(`Invalid value for ${name}: must be one or more ASCII digits (unquoted)`);
      }
      result[name] = parseInt(rawValue, 10);
      continue;
    }

    // Other directives
    if (rawValue.startsWith('"')) {
      if (!rawValue.endsWith('"') || rawValue.length < 2) {
        throw new SyntaxError(`Unterminated quoted string for directive: ${name}`);
      }
      // Check it's a properly terminated quote (length >= 2 and ends with ")
      if (rawValue.length === 1) {
        throw new SyntaxError(`Unterminated quoted string for directive: ${name}`);
      }
      result[name] = rawValue.slice(1, -1);
    } else {
      result[name] = rawValue;
    }
  }

  return result;
}