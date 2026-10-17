// bloom-deps:

export function parseCSVLine(line: string, delimiter?: string): string[] {
  if (typeof line !== 'string') {
    throw new TypeError('line must be a string');
  }

  const delim = delimiter !== undefined ? delimiter : ',';

  if (delimiter !== undefined) {
    if (typeof delimiter !== 'string' || delimiter.length !== 1) {
      throw new TypeError('delimiter must be a single-character string');
    }
  }

  const fields: string[] = [];
  let pos = 0;

  while (pos <= line.length) {
    // Check if field starts with a double quote
    if (pos < line.length && line[pos] === '"') {
      // Quoted field
      const openQuotePos = pos;
      pos++; // skip opening quote
      let value = '';
      let closed = false;

      while (pos < line.length) {
        const ch = line[pos];
        if (ch === '"') {
          // Check for escaped double quote
          if (pos + 1 < line.length && line[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
            // Closing quote
            pos++; // skip closing quote
            closed = true;
            break;
          }
        } else {
          value += ch;
          pos++;
        }
      }

      if (!closed) {
        // Unclosed quote: return remainder of line from opening quote as single field
        fields.push(line.substring(openQuotePos));
        return fields;
      }

      fields.push(value);

      // After closing quote, expect delimiter or end of line
      if (pos < line.length) {
        if (line[pos] === delim) {
          pos++; // skip delimiter
        }
        // If there's something else after closing quote, it's technically malformed
        // but we just continue; the field is already captured
      } else {
        // End of line after closing quote
        break;
      }
    } else {
      // Unquoted field: read until delimiter or end of line
      let value = '';
      while (pos < line.length && line[pos] !== delim) {
        value += line[pos];
        pos++;
      }
      fields.push(value);

      if (pos < line.length && line[pos] === delim) {
        pos++; // skip delimiter
      } else {
        // End of line
        break;
      }
    }

    // If we consumed the delimiter and are now at end of line, add empty field
    if (pos === line.length) {
      // Check if the last char was a delimiter (we just skipped it)
      // We need to add an empty trailing field only if line ends with delimiter
      // This is handled by the loop condition: pos <= line.length
      // The next iteration will add an empty unquoted field
    }
  }

  // Handle trailing delimiter: if line ends with delimiter, add empty field
  // This is handled by the while (pos <= line.length) loop going one past end
  // Actually let's re-check: after skipping delimiter at end, pos === line.length
  // then loop condition pos <= line.length is true (pos === line.length),
  // so we enter with pos === line.length, the else branch runs,
  // value = '', we push '', then pos is still line.length (not < line.length, not delim),
  // so we break. That correctly handles trailing delimiter.

  return fields;
}