// bloom-deps:

export function matchGlob(pattern: unknown, path: unknown): boolean {
  if (typeof pattern !== 'string') {
    throw new TypeError('pattern must be a string');
  }
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  // Parse pattern into tokens
  type Token =
    | { kind: 'literal'; char: string }
    | { kind: 'question' }
    | { kind: 'star' }
    | { kind: 'doublestar' }
    | { kind: 'slash' };

  // We'll work segment by segment, but first validate and tokenize
  // Check for trailing lone backslash
  // We need to parse the pattern to detect this
  function parsePattern(pat: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < pat.length) {
      const ch = pat[i];
      if (ch === '\\') {
        if (i + 1 >= pat.length) {
          throw new SyntaxError('Pattern ends with a lone backslash');
        }
        tokens.push({ kind: 'literal', char: pat[i + 1] });
        i += 2;
      } else if (ch === '/') {
        tokens.push({ kind: 'slash' });
        i++;
      } else if (ch === '?') {
        tokens.push({ kind: 'question' });
        i++;
      } else if (ch === '*') {
        if (i + 1 < pat.length && pat[i + 1] === '*') {
          // Could be ** segment, but we need to determine context
          // We'll mark as doublestar provisionally; context resolution below
          tokens.push({ kind: 'doublestar' });
          i += 2;
        } else {
          tokens.push({ kind: 'star' });
          i++;
        }
      } else {
        tokens.push({ kind: 'literal', char: ch });
        i++;
      }
    }
    return tokens;
  }

  // We'll work with pattern segments and path segments
  // First, let's do a segment-based approach

  // Split pattern into segments, respecting escapes
  // A segment is separated by '/'
  // We need to handle ** as a full-segment wildcard only when the segment is exactly '**'

  type PatternSegment =
    | { kind: 'doublestar' }
    | { kind: 'normal'; parts: NormalPart[] };

  type NormalPart =
    | { kind: 'literal'; char: string }
    | { kind: 'question' }
    | { kind: 'star' };

  function parsePatternSegments(pat: string): PatternSegment[] {
    const segments: PatternSegment[] = [];
    let i = 0;
    let currentParts: NormalPart[] = [];

    function flushSegment() {
      // Check if this segment is exactly a doublestar
      // A doublestar segment has exactly one part which came from '**' not escaped
      // We track this differently: a segment is doublestar iff it was literally '**'
      // We need to know if the segment text (raw) is exactly '**'
      // We'll use the rawSegment flag approach
    }

    // Re-parse with segment awareness
    const rawSegments: string[] = [];
    let segStart = 0;
    let j = 0;
    while (j < pat.length) {
      if (pat[j] === '\\') {
        if (j + 1 >= pat.length) {
          throw new SyntaxError('Pattern ends with a lone backslash');
        }
        j += 2;
      } else if (pat[j] === '/') {
        rawSegments.push(pat.slice(segStart, j));
        segStart = j + 1;
        j++;
      } else {
        j++;
      }
    }
    rawSegments.push(pat.slice(segStart));

    for (const rawSeg of rawSegments) {
      if (rawSeg === '**') {
        segments.push({ kind: 'doublestar' });
      } else {
        // Parse the segment into parts
        const parts: NormalPart[] = [];
        let k = 0;
        while (k < rawSeg.length) {
          const c = rawSeg[k];
          if (c === '\\') {
            // Already validated no trailing backslash at end of pattern
            parts.push({ kind: 'literal', char: rawSeg[k + 1] });
            k += 2;
          } else if (c === '?') {
            parts.push({ kind: 'question' });
            k++;
          } else if (c === '*') {
            // Collapse consecutive stars into one star
            parts.push({ kind: 'star' });
            k++;
            while (k < rawSeg.length && rawSeg[k] === '*') {
              k++;
            }
          } else {
            parts.push({ kind: 'literal', char: c });
            k++;
          }
        }
        segments.push({ kind: 'normal', parts });
      }
    }

    return segments;
  }

  // Match a normal segment's parts against a path segment string
  function matchSegment(parts: NormalPart[], seg: string): boolean {
    // Dynamic programming / recursive matching
    function dp(pi: number, si: number): boolean {
      if (pi === parts.length && si === seg.length) return true;
      if (pi === parts.length) return false;

      const part = parts[pi];
      if (part.kind === 'literal') {
        if (si < seg.length && seg[si] === part.char) {
          return dp(pi + 1, si + 1);
        }
        return false;
      } else if (part.kind === 'question') {
        if (si < seg.length && seg[si] !== '/') {
          return dp(pi + 1, si + 1);
        }
        return false;
      } else if (part.kind === 'star') {
        // Match zero or more non-'/' characters
        // Try all lengths
        for (let len = 0; si + len <= seg.length; len++) {
          if (si + len < seg.length && seg[si + len] === '/') break;
          if (dp(pi + 1, si + len)) return true;
        }
        return false;
      }
      return false;
    }

    return dp(0, 0);
  }

  const patternSegments = parsePatternSegments(pattern);
  const pathSegments = path === '' ? [''] : path.split('/');

  // Match patternSegments against pathSegments using recursion with memoization
  // patternSegments[pi..] vs pathSegments[si..]
  const memo = new Map<string, boolean>();

  function match(pi: number, si: number): boolean {
    const key = `${pi},${si}`;
    if (memo.has(key)) return memo.get(key)!;

    if (pi === patternSegments.length && si === pathSegments.length) {
      memo.set(key, true);
      return true;
    }
    if (pi === patternSegments.length) {
      memo.set(key, false);
      return false;
    }

    const pSeg = patternSegments[pi];

    if (pSeg.kind === 'doublestar') {
      // Match zero or more path segments
      // Try consuming 0, 1, 2, ... path segments
      for (let skip = 0; si + skip <= pathSegments.length; skip++) {
        if (match(pi + 1, si + skip)) {
          memo.set(key, true);
          return true;
        }
      }
      memo.set(key, false);
      return false;
    } else {
      // Normal segment
      if (si >= pathSegments.length) {
        memo.set(key, false);
        return false;
      }
      const result = matchSegment(pSeg.parts, pathSegments[si]) && match(pi + 1, si + 1);
      memo.set(key, result);
      return result;
    }
  }

  return match(0, 0);
}