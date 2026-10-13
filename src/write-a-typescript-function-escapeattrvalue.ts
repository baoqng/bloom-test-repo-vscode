// bloom-deps:

export function escapeAttr(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError(`escapeAttr: expected string, got ${typeof value}`);
  }

  // Process the string character by character to handle surrogates and control chars
  // Ampersand must be escaped first to avoid double-escaping
  let result = '';
  let i = 0;

  while (i < value.length) {
    const code = value.charCodeAt(i);

    // Handle high surrogate (U+D800–U+DBFF)
    if (code >= 0xD800 && code <= 0xDBFF) {
      if (i + 1 < value.length) {
        const nextCode = value.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          // Properly paired surrogate — passthrough both
          result += value[i] + value[i + 1];
          i += 2;
          continue;
        }
      }
      // Lone high surrogate — replace with U+FFFD
      result += '\uFFFD';
      i++;
      continue;
    }

    // Handle low surrogate (U+DC00–U+DFFF) — lone low surrogate
    if (code >= 0xDC00 && code <= 0xDFFF) {
      result += '\uFFFD';
      i++;
      continue;
    }

    const ch = value[i];

    // Escape ampersand first
    if (ch === '&') {
      result += '&amp;';
    } else if (ch === '"') {
      result += '&quot;';
    } else if (ch === "'") {
      result += '&#39;';
    } else if (ch === '<') {
      result += '&lt;';
    } else if (ch === '>') {
      result += '&gt;';
    } else if (ch === '`') {
      result += '&#96;';
    } else if (code === 0x7F) {
      // U+007F DEL
      result += '&#x7F;';
    } else if (
      code <= 0x1F &&
      code !== 0x09 && // tab
      code !== 0x0A && // line feed
      code !== 0x0D    // carriage return
    ) {
      // ASCII control character — &#xHH; with uppercase hex and two digits
      const hex = code.toString(16).toUpperCase().padStart(2, '0');
      result += `&#x${hex};`;
    } else {
      result += ch;
    }

    i++;
  }

  return result;
}