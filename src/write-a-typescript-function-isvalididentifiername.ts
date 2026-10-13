// bloom-deps:

const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with',
  // strict-mode reserved words
  'implements', 'interface', 'let', 'package', 'private', 'protected',
  'public', 'static', 'yield',
  // await
  'await',
]);

// Regex for ID_Start (first character): Unicode property escape
// Supported in V8/Node.js 10+
let ID_START_RE: RegExp;
let ID_CONTINUE_RE: RegExp;

try {
  ID_START_RE = /^\p{ID_Start}$/u;
  ID_CONTINUE_RE = /^\p{ID_Continue}$/u;
} catch {
  // Fallback for environments that don't support Unicode property escapes
  ID_START_RE = /^[A-Za-z_]$/;
  ID_CONTINUE_RE = /^[A-Za-z0-9_]$/;
}

function isIDStart(char: string): boolean {
  if (char === '$' || char === '_') return true;
  try {
    return ID_START_RE.test(char);
  } catch {
    return false;
  }
}

function isIDContinue(char: string): boolean {
  if (char === '$') return true;
  // ZWNJ (U+200C) and ZWJ (U+200D)
  const cp = char.codePointAt(0);
  if (cp === 0x200C || cp === 0x200D) return true;
  try {
    return ID_CONTINUE_RE.test(char);
  } catch {
    return false;
  }
}

// Guard against unicode escape sequences: backslash in identifier source means it's not valid
// (the task states raw \uXXXX sequences in the string itself make the result false)
function containsBackslash(name: string): boolean {
  return name.includes('\\');
}

export function isValidIdentifier(name: unknown): boolean {
  try {
    // Return false for non-string inputs
    if (typeof name !== 'string') {
      return false;
    }

    // Return false for empty string
    if (name.length === 0) {
      return false;
    }

    // Return false if it contains backslash (unicode escape sequences)
    if (containsBackslash(name)) {
      return false;
    }

    // Return false for reserved words
    if (RESERVED_WORDS.has(name)) {
      return false;
    }

    // Iterate by code point (not UTF-16 units) to handle astral characters
    const codePoints = [...name];

    // Validate first code point
    const first = codePoints[0];
    if (!isIDStart(first)) {
      return false;
    }

    // Validate subsequent code points
    for (let i = 1; i < codePoints.length; i++) {
      const char = codePoints[i];
      if (!isIDContinue(char)) {
        return false;
      }
    }

    return true;
  } catch {
    // Never throws
    return false;
  }
}