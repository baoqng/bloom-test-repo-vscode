// bloom-deps:

export function splitArgs(line: unknown): string[] {
  if (typeof line !== 'string') {
    throw new TypeError('Expected a string argument');
  }

  const args: string[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Skip whitespace separators
    if (line[i] === ' ' || line[i] === '\t') {
      i++;
      continue;
    }

    // We have the start of a new argument
    let arg = '';
    let hasContent = false;

    // Parse one argument (may consist of quoted/unquoted segments glued together)
    while (i < len && line[i] !== ' ' && line[i] !== '\t') {
      const ch = line[i];

      if (ch === "'") {
        // Single-quoted segment: everything literal until closing '
        hasContent = true;
        i++; // skip opening '
        while (i < len && line[i] !== "'") {
          arg += line[i];
          i++;
        }
        if (i >= len) {
          throw new SyntaxError('Unterminated single quote');
        }
        i++; // skip closing '
      } else if (ch === '"') {
        // Double-quoted segment
        hasContent = true;
        i++; // skip opening "
        while (i < len && line[i] !== '"') {
          if (line[i] === '\\') {
            // Backslash inside double quotes
            i++;
            if (i >= len) {
              // Backslash at end inside double quotes — treated as literal backslash
              // (the unterminated quote error will trigger next iteration)
              arg += '\\';
              break;
            }
            const next = line[i];
            if (next === '"' || next === '\\' || next === '$' || next === '`') {
              arg += next;
              i++;
            } else {
              // Keep backslash literally before other characters
              arg += '\\';
              arg += next;
              i++;
            }
          } else {
            arg += line[i];
            i++;
          }
        }
        if (i >= len) {
          throw new SyntaxError('Unterminated double quote');
        }
        i++; // skip closing "
      } else if (ch === '\\') {
        // Backslash outside quotes
        i++;
        if (i >= len) {
          throw new SyntaxError('Backslash at end of line');
        }
        arg += line[i];
        hasContent = true;
        i++;
      } else {
        arg += ch;
        hasContent = true;
        i++;
      }
    }

    if (hasContent || arg !== '') {
      args.push(arg);
    }
  }

  return args;
}