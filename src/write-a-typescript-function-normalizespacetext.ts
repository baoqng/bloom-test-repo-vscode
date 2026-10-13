// bloom-deps:

export function normalizeSpace(text: unknown): string {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof text}`);
  }

  // Apply Unicode NFC normalization first
  const normalized = text.normalize('NFC');

  // Define whitespace characters:
  // \s (JavaScript) + U+200B (zero-width space) + U+FEFF (BOM)
  // but NOT U+00A0 (no-break space)
  // Line break characters: U+000A, U+000D, U+2028, U+2029
  const lineBreakChars = new Set(['\u000A', '\u000D', '\u2028', '\u2029']);

  // Build a regex that matches runs of our custom whitespace
  // \s matches: space, tab, \n, \r, \f, \v, \u00a0, \u1680, \u2000-\u200a, \u2028, \u2029, \u202f, \u205f, \u3000, \ufeff
  // We need to EXCLUDE \u00a0 from our whitespace set.
  // Strategy: match runs of whitespace characters manually
  // Custom whitespace = (\s except \u00a0) | \u200B | \uFEFF
  // \s includes \uFEFF in JS, so we just need to exclude \u00a0
  
  // We'll process character by character to handle this precisely
  const chars = [...normalized];
  
  function isCustomWhitespace(ch: string): boolean {
    if (ch === '\u00A0') return false; // no-break space preserved
    if (ch === '\u200B') return true;  // zero-width space
    if (ch === '\uFEFF') return true;  // BOM
    // Check JS \s (which includes \u00a0, but we already excluded it above)
    return /\s/.test(ch);
  }

  function isLineBreak(ch: string): boolean {
    return lineBreakChars.has(ch);
  }

  // Tokenize into runs: whitespace runs and non-whitespace segments
  type Token = { type: 'text'; value: string } | { type: 'ws'; hasLineBreak: boolean };
  const tokens: Token[] = [];

  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (isCustomWhitespace(ch)) {
      // Collect whitespace run
      let hasLineBreak = isLineBreak(ch);
      let j = i + 1;
      while (j < chars.length && isCustomWhitespace(chars[j])) {
        if (isLineBreak(chars[j])) {
          hasLineBreak = true;
        }
        j++;
      }
      tokens.push({ type: 'ws', hasLineBreak });
      i = j;
    } else {
      // Collect non-whitespace run
      let j = i + 1;
      while (j < chars.length && !isCustomWhitespace(chars[j])) {
        j++;
      }
      tokens.push({ type: 'text', value: chars.slice(i, j).join('') });
      i = j;
    }
  }

  // Remove leading/trailing whitespace tokens
  let start = 0;
  let end = tokens.length - 1;

  while (start <= end && tokens[start].type === 'ws') {
    start++;
  }
  while (end >= start && tokens[end].type === 'ws') {
    end--;
  }

  const trimmed = tokens.slice(start, end + 1);

  // Build result
  const parts: string[] = [];
  for (const token of trimmed) {
    if (token.type === 'text') {
      parts.push(token.value);
    } else {
      // whitespace token
      if (token.hasLineBreak) {
        parts.push('\u000A');
      } else {
        parts.push('\u0020');
      }
    }
  }

  return parts.join('');
}