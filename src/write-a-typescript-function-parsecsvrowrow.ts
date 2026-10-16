export function parseCSVRow(row: string, options?: { delimiter?: string; trimFields?: boolean }): string[] {
  if (typeof row !== 'string') {
    throw new TypeError('row must be a string');
  }

  const delimiter = options?.delimiter ?? ',';
  if (typeof delimiter !== 'string' || delimiter.length !== 1) {
    throw new TypeError('delimiter must be a single character');
  }

  const trimFields = options?.trimFields ?? false;
  const fields: string[] = [];
  let current = '';
  let i = 0;
  let currentFieldIsQuoted = false;

  while (i < row.length) {
    const char = row[i];

    if (char === '"') {
      // Start of quoted field
      currentFieldIsQuoted = true;
      i++;
      let quotedValue = '';
      let closed = false;

      while (i < row.length) {
        if (row[i] === '"') {
          // Check if this is an escaped quote (doubled quote)
          if (i + 1 < row.length && row[i + 1] === '"') {
            quotedValue += '"';
            i += 2;
          } else {
            // End of quoted field
            i++;
            closed = true;
            break;
          }
        } else {
          quotedValue += row[i];
          i++;
        }
      }

      // Check if the quoted field was properly closed
      if (!closed) {
        throw new SyntaxError('unterminated quoted field');
      }

      // Check for unexpected character after closing quote
      if (i < row.length && row[i] !== delimiter) {
        throw new SyntaxError('unexpected character after closing quote');
      }

      current = quotedValue;

      // Skip delimiter if present
      if (i < row.length && row[i] === delimiter) {
        fields.push(current);
        current = '';
        currentFieldIsQuoted = false;
        i++;
      }
    } else if (char === delimiter) {
      // End of unquoted field
      if (trimFields && !currentFieldIsQuoted) {
        current = current.trim();
      }
      fields.push(current);
      current = '';
      currentFieldIsQuoted = false;
      i++;
    } else {
      // Regular character in unquoted field
      current += char;
      i++;
    }
  }

  // Add the last field
  if (trimFields && !currentFieldIsQuoted) {
    current = current.trim();
  }
  fields.push(current);

  return fields;
}