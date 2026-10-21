// bloom-deps:

export type ParseResult<T> = { ok: true; value: T; rest: string } | { ok: false; expected: string; at: number };
export type Parser<T> = (input: string, pos?: number) => ParseResult<T>;

export function lit(s: string): Parser<string> {
  return function(input: string, pos: number = 0): ParseResult<string> {
    if (input.startsWith(s, pos)) {
      return { ok: true, value: s, rest: input.slice(pos + s.length) };
    }
    return { ok: false, expected: JSON.stringify(s), at: pos };
  };
}

export function regex(pattern: RegExp, name?: string): Parser<string> {
  if (pattern.flags.includes('g')) {
    throw new TypeError('regex parser does not support the g flag');
  }
  return function(input: string, pos: number = 0): ParseResult<string> {
    const slice = input.slice(pos);
    const anchored = new RegExp(pattern.source, pattern.flags.includes('y') ? pattern.flags : pattern.flags + 'y');
    anchored.lastIndex = 0;
    const match = anchored.exec(slice);
    if (match !== null) {
      return { ok: true, value: match[0], rest: input.slice(pos + match[0].length) };
    }
    return { ok: false, expected: name !== undefined ? name : pattern.toString(), at: pos };
  };
}

export function seq<T extends unknown[]>(...parsers: { [K in keyof T]: Parser<T[K]> }): Parser<T> {
  return function(input: string, pos: number = 0): ParseResult<T> {
    if (parsers.length === 0) {
      return { ok: true, value: [] as unknown as T, rest: input.slice(pos) };
    }
    const values: unknown[] = [];
    let currentPos = pos;
    let currentRest = input.slice(pos);
    for (const parser of parsers) {
      const result = parser(input, currentPos);
      if (!result.ok) {
        return result as ParseResult<T>;
      }
      values.push(result.value);
      currentPos = input.length - result.rest.length;
      currentRest = result.rest;
    }
    return { ok: true, value: values as T, rest: currentRest };
  };
}

export function choice<T>(...parsers: Parser<T>[]): Parser<T> {
  return function(input: string, pos: number = 0): ParseResult<T> {
    if (parsers.length === 0) {
      return { ok: false, expected: 'no parsers', at: pos };
    }
    let furthestFailure: { ok: false; expected: string; at: number } | null = null;
    for (const parser of parsers) {
      const result = parser(input, pos);
      if (result.ok) {
        return result;
      }
      if (furthestFailure === null || result.at > furthestFailure.at) {
        furthestFailure = result;
      }
    }
    return furthestFailure!;
  };
}

export function many<T>(parser: Parser<T>, min: number = 0, max?: number): Parser<T[]> {
  return function(input: string, pos: number = 0): ParseResult<T[]> {
    if (max === 0) {
      return { ok: true, value: [], rest: input.slice(pos) };
    }
    const values: T[] = [];
    let currentPos = pos;
    let currentRest = input.slice(pos);
    let lastFailure: { ok: false; expected: string; at: number } | null = null;
    while (true) {
      if (max !== undefined && values.length >= max) {
        break;
      }
      const result = parser(input, currentPos);
      if (!result.ok) {
        lastFailure = result;
        break;
      }
      values.push(result.value);
      const newPos = input.length - result.rest.length;
      if (newPos === currentPos) {
        // Prevent infinite loop on zero-width match
        currentRest = result.rest;
        break;
      }
      currentPos = newPos;
      currentRest = result.rest;
    }
    if (values.length < min) {
      if (lastFailure !== null) {
        return lastFailure;
      }
      return { ok: false, expected: `at least ${min} occurrences`, at: currentPos };
    }
    return { ok: true, value: values, rest: currentRest };
  };
}

export function map<T, U>(parser: Parser<T>, fn: (v: T) => U): Parser<U> {
  return function(input: string, pos: number = 0): ParseResult<U> {
    const result = parser(input, pos);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: fn(result.value), rest: result.rest };
  };
}

export function optional<T>(parser: Parser<T>): Parser<T | null> {
  return function(input: string, pos: number = 0): ParseResult<T | null> {
    const result = parser(input, pos);
    if (!result.ok) {
      return { ok: true, value: null, rest: input.slice(pos) };
    }
    return result;
  };
}

export function between<T>(open: Parser<unknown>, parser: Parser<T>, close: Parser<unknown>): Parser<T> {
  return function(input: string, pos: number = 0): ParseResult<T> {
    const openResult = open(input, pos);
    if (!openResult.ok) {
      return openResult as ParseResult<T>;
    }
    const openPos = input.length - openResult.rest.length;
    const parserResult = parser(input, openPos);
    if (!parserResult.ok) {
      return parserResult;
    }
    const parserPos = input.length - parserResult.rest.length;
    const closeResult = close(input, parserPos);
    if (!closeResult.ok) {
      return closeResult as ParseResult<T>;
    }
    return { ok: true, value: parserResult.value, rest: closeResult.rest };
  };
}

export function sepBy<T>(parser: Parser<T>, separator: Parser<unknown>): Parser<T[]> {
  return function(input: string, pos: number = 0): ParseResult<T[]> {
    const first = parser(input, pos);
    if (!first.ok) {
      return { ok: true, value: [], rest: input.slice(pos) };
    }
    const values: T[] = [first.value];
    let currentPos = input.length - first.rest.length;
    let currentRest = first.rest;
    while (true) {
      const sepResult = separator(input, currentPos);
      if (!sepResult.ok) {
        break;
      }
      const sepPos = input.length - sepResult.rest.length;
      const itemResult = parser(input, sepPos);
      if (!itemResult.ok) {
        break;
      }
      values.push(itemResult.value);
      currentPos = input.length - itemResult.rest.length;
      currentRest = itemResult.rest;
    }
    return { ok: true, value: values, rest: currentRest };
  };
}

export function eof(): Parser<null> {
  return function(input: string, pos: number = 0): ParseResult<null> {
    if (pos === input.length) {
      return { ok: true, value: null, rest: '' };
    }
    return { ok: false, expected: 'end of input', at: pos };
  };
}

export function lazy<T>(fn: () => Parser<T>): Parser<T> {
  return function(input: string, pos: number = 0): ParseResult<T> {
    const parser = fn();
    return parser(input, pos);
  };
}