// bloom-deps:

export function getWordAtPosition(text: string, position: number): string | null {
  if (position < 0 || position >= text.length) {
    return null;
  }

  const char = text[position];
  if (!/\w/.test(char)) {
    return null;
  }

  let start = position;
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }

  let end = position;
  while (end < text.length - 1 && /\w/.test(text[end + 1])) {
    end++;
  }

  return text.slice(start, end + 1);
}