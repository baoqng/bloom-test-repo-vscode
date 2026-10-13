// bloom-deps:

export function parseEnv(source: unknown): Record<string, string> {
  if (typeof source !== 'string') {
    throw new TypeError('source must be a string');
  }

  const result = Object.create(null) as Record<string, string>;
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    let line = lines[i];

    // Skip blank lines
    if (line.trim() === '') {
      continue;
    }

    // Skip comment lines (first non-whitespace char is '#')
    if (/^\s*#/.test(line)) {
      continue;
    }

    // Handle optional leading 'export '
    if (line.startsWith('export ')) {
      line = line.substring(7);
      // After removing 'export ', trim leading whitespace
      line = line.trimStart();
    }

    // Find the '=' separator
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      throw new SyntaxError(`Line ${lineNumber}: missing '=' separator`);
    }

    // Extract and validate key
    const key = line.substring(0, eqIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new SyntaxError(`Line ${lineNumber}: invalid key format '${key}'`);
    }

    // Extract the raw value portion (everything after '=')
    const rawValue = line.substring(eqIndex + 1);

    // Determine value type and parse accordingly
    const trimmedRaw = rawValue.trimStart();

    let value: string;

    if (trimmedRaw.startsWith('"')) {
      // Double-quoted value
      value = parseDoubleQuoted(trimmedRaw, lineNumber);
    } else if (trimmedRaw.startsWith("'")) {
      // Single-quoted value
      value = parseSingleQuoted(trimmedRaw, lineNumber);
    } else {
      // Unquoted value: trim and strip inline comment starting with ' #'
      value = parseUnquoted(rawValue);
    }

    result[key] = value;
  }

  return result;
}

function parseDoubleQuoted(raw: string, lineNumber: number): string {
  // raw starts with '"'
  let i = 1; // skip opening quote
  let value = '';

  while (i < raw.length) {
    const ch = raw[i];

    if (ch === '\\') {
      // Escape sequence
      if (i + 1 >= raw.length) {
        throw new SyntaxError(`Line ${lineNumber}: unterminated escape sequence in double-quoted value`);
      }
      const next = raw[i + 1];
      if (next === 'n') {
        value += '\n';
      } else if (next === 't') {
        value += '\t';
      } else if (next === '\\') {
        value += '\\';
      } else if (next === '"') {
        value += '"';
      } else {
        throw new SyntaxError(`Line ${lineNumber}: unsupported escape sequence '\\${next}' in double-quoted value`);
      }
      i += 2;
    } else if (ch === '"') {
      // Closing quote found
      const after = raw.substring(i + 1);
      validateAfterClosingQuote(after, lineNumber);
      return value;
    } else {
      value += ch;
      i++;
    }
  }

  throw new SyntaxError(`Line ${lineNumber}: unterminated double-quoted value`);
}

function parseSingleQuoted(raw: string, lineNumber: number): string {
  // raw starts with "'"
  // Find the closing single quote
  const closeIndex = raw.indexOf("'", 1);
  if (closeIndex === -1) {
    throw new SyntaxError(`Line ${lineNumber}: unterminated single-quoted value`);
  }

  const value = raw.substring(1, closeIndex);
  const after = raw.substring(closeIndex + 1);
  validateAfterClosingQuote(after, lineNumber);
  return value;
}

function validateAfterClosingQuote(after: string, lineNumber: number): void {
  // After closing quote, only whitespace or a ' #' comment is allowed
  const trimmed = after.trimStart();
  if (trimmed === '') {
    return;
  }
  if (trimmed.startsWith('#')) {
    // A '#' immediately after trimming — but the spec says ' #' (space then hash)
    // means inline comment. After closing quote, if after trimming we get '#',
    // that means the original had whitespace before '#'. That's allowed.
    return;
  }
  throw new SyntaxError(`Line ${lineNumber}: unexpected text after closing quote`);
}

function parseUnquoted(raw: string): string {
  // Trim leading and trailing whitespace
  let value = raw.trim();

  // Remove inline comment starting with ' #' (space then hash)
  // Find ' #' in the value
  const commentMatch = value.indexOf(' #');
  if (commentMatch !== -1) {
    value = value.substring(0, commentMatch).trimEnd();
  }

  return value;
}