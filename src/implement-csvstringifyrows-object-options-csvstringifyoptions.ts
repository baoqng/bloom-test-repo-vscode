// bloom-deps:

export interface CSVStringifyOptions {
  delimiter?: string;
  quote?: string;
  lineEnding?: '\n' | '\r\n';
  header?: boolean;
  columns?: string[];
  nullValue?: string;
}

export function csvStringify(rows: object[], options?: CSVStringifyOptions): string {
  if (!Array.isArray(rows)) {
    throw new TypeError('rows must be an array');
  }

  if (rows.length === 0) {
    return '';
  }

  const delimiter = options?.delimiter ?? ',';
  const quote = options?.quote ?? '"';
  const lineEnding = options?.lineEnding ?? '\r\n';
  const includeHeader = options?.header ?? true;
  const nullValue = options?.nullValue ?? '';

  if (delimiter.length !== 1) {
    throw new TypeError('delimiter must be exactly 1 character');
  }
  if (quote.length !== 1) {
    throw new TypeError('quote must be exactly 1 character');
  }

  const columns: string[] = options?.columns ?? Object.keys(rows[0]);

  function needsQuoting(value: string): boolean {
    return (
      value.includes(delimiter) ||
      value.includes(quote) ||
      value.includes('\n') ||
      value.includes('\r') ||
      value.startsWith(' ') ||
      value.endsWith(' ')
    );
  }

  function formatField(value: unknown): string {
    if (value === null || value === undefined) {
      return nullValue;
    }

    const str = String(value);

    if (needsQuoting(str)) {
      const escaped = str.split(quote).join(quote + quote);
      return `${quote}${escaped}${quote}`;
    }

    return str;
  }

  function formatRow(obj: Record<string, unknown>): string {
    return columns.map(col => {
      const value = Object.prototype.hasOwnProperty.call(obj, col) ? (obj as Record<string, unknown>)[col] : undefined;
      return formatField(value);
    }).join(delimiter);
  }

  const lines: string[] = [];

  if (includeHeader) {
    const headerLine = columns.map(col => {
      if (needsQuoting(col)) {
        const escaped = col.split(quote).join(quote + quote);
        return `${quote}${escaped}${quote}`;
      }
      return col;
    }).join(delimiter);
    lines.push(headerLine);
  }

  for (const row of rows) {
    lines.push(formatRow(row as Record<string, unknown>));
  }

  return lines.join(lineEnding) + lineEnding;
}