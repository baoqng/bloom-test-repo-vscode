// bloom-deps:

export function parseCsvRecord(line: unknown, delimiter: string = ','): string[] {
  // Input validation: line must be a string
  if (typeof line !== 'string') {
    throw new TypeError('line must be a string');
  }

  // Input validation: delimiter must be a string
  if (typeof delimiter !== 'string') {
    throw new TypeError('delimiter must be a string');
  }

  // Delimiter validation: must be exactly one character
  if (delimiter.length !== 1) {
    throw new RangeError('delimiter must be exactly one character');
  }

  // Delimiter validation: cannot be double quote
  if (delimiter === '"') {
    throw new RangeError('delimiter cannot be a double quote character');
  }

  // Delimiter validation: cannot be carriage return
  if (delimiter === '\r') {
    throw new RangeError('delimiter cannot be a carriage return character');
  }

  // Delimiter validation: cannot be line feed
  if (delimiter === '\n') {
    throw new RangeError('delimiter cannot be a line feed character');
  }

  // Strip trailing CRLF or LF
  let processedLine = line;
  if (processedLine.endsWith('\r\n')) {
    processedLine = processedLine.slice(0, -2);
  } else if (processedLine.endsWith('\n')) {
    processedLine = processedLine.slice(0, -1);
  }

  // Handle empty line case
  if (processedLine === '') {
    return [''];
  }

  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < processedLine.length) {
    const char = processedLine[i];

    if (inQuotes) {
      // Inside a quoted field
      if (char === '"') {
        // Check for doubled quote
        if (i + 1 < processedLine.length && processedLine[i + 1] === '"') {
          // Doubled quote: add single quote to field
          currentField += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;

          // Check for characters after closing quote (must be delimiter or end of line)
          if (i < processedLine.length && processedLine[i] !== delimiter) {
            throw new SyntaxError(
              'characters appear after a closing quote other than the delimiter'
            );
          }
        }
      } else {
        // Inside quotes, any character (including delimiter, CR, LF) is literal
        currentField += char;
        i++;
      }
    } else {
      // Outside quotes
      if (char === '"') {
        // Opening quote in unquoted field
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        // Field delimiter
        fields.push(currentField);
        currentField = '';
        i++;
      } else if (char === '"') {
        // Double quote inside unquoted field (already handled above, but for clarity)
        throw new SyntaxError('a double quote appears inside an unquoted field');
      } else {
        // Regular character
        currentField += char;
        i++;
      }
    }
  }

  // Check for unterminated quoted field
  if (inQuotes) {
    throw new SyntaxError('a quoted field is opened but never closed before end of input');
  }

  // Add the last field
  fields.push(currentField);

  return fields;
}