// bloom-deps:

type INISection = Record<string, string>;
type INIData = { _global: INISection } & Record<string, INISection>;

export function parseINI(text: string): INIData {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be a string');
  }

  // Normalize CRLF to LF
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const result: INIData = { _global: {} };
  let currentSection = '_global';

  // We process lines with an index so we can skip ahead for continuations
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    i++;

    // Skip blank/whitespace-only lines
    if (line.trim() === '') {
      continue;
    }

    // Skip comment lines (first non-whitespace char is ; or #)
    const firstNonWS = line.trimStart()[0];
    if (firstNonWS === ';' || firstNonWS === '#') {
      continue;
    }

    // Section header
    const sectionMatch = line.match(/^\s*\[([^\]]*)\]\s*$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();
      currentSection = sectionName;
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^([^=:]+)[=:](.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2].trim();

      // Handle multi-line continuation
      while (value.endsWith('\\')) {
        // Remove trailing backslash
        value = value.slice(0, -1);

        // Find next non-comment, non-blank line
        let found = false;
        while (i < lines.length) {
          const nextLine = lines[i];
          i++;

          // Skip blank lines
          if (nextLine.trim() === '') {
            continue;
          }

          // Skip comment lines
          const nextFirstNonWS = nextLine.trimStart()[0];
          if (nextFirstNonWS === ';' || nextFirstNonWS === '#') {
            continue;
          }

          // This is the continuation line — strip leading whitespace
          value = value + nextLine.trimStart();
          found = true;
          break;
        }

        if (!found) {
          // No more continuation lines available
          break;
        }
      }

      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      result[currentSection][key] = value;
      continue;
    }

    // If we get here, the line is not a comment, not blank, not a section header,
    // and not a key-value pair — throw SyntaxError
    throw new SyntaxError(line);
  }

  return result;
}