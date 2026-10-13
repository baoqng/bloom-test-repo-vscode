// bloom-deps:

export function escapeRegExp(text: unknown): string {
  if (typeof text !== 'string') {
    throw new TypeError(`Expected a string but received ${typeof text}`);
  }

  if (text === '') {
    return '';
  }

  // Escape special regex characters with backslash, and escape '-' as \x2d
  // so the result is safe inside a character class under the u flag.
  // Characters to escape with backslash: ^ $ \ . * + ? ( ) [ ] { } | /
  // Characters to escape as \x2d: -
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    switch (ch) {
      case '-':
        result += '\\x2d';
        break;
      case '^':
      case '$':
      case '\\':
      case '.':
      case '*':
      case '+':
      case '?':
      case '(':
      case ')':
      case '[':
      case ']':
      case '{':
      case '}':
      case '|':
      case '/':
        result += '\\' + ch;
        break;
      default:
        result += ch;
        break;
    }
  }

  return result;
}