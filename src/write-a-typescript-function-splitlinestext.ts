// bloom-deps:

export function splitLines(text: string): string[] {
  if (text === '') {
    return [];
  }

  // Normalize Windows line endings to Unix
  const normalized = text.replace(/\r\n/g, '\n');

  // Strip trailing newline if present
  const trimmed = normalized.endsWith('\n')
    ? normalized.slice(0, -1)
    : normalized;

  return trimmed.split('\n');
}