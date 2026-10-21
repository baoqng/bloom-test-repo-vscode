// bloom-deps:

export class StringScanner {
  private readonly _input: string;
  private _pos: number;

  constructor(input: string) {
    if (typeof input !== 'string') {
      throw new TypeError('StringScanner: input must be a string');
    }
    this._input = input;
    this._pos = 0;
  }

  get pos(): number {
    return this._pos;
  }

  get rest(): string {
    return this._input.slice(this._pos);
  }

  isEos(): boolean {
    return this._pos >= this._input.length;
  }

  peek(n?: number): string {
    const count = n === undefined ? 1 : n;
    if (typeof count !== 'number' || !isFinite(count)) {
      throw new TypeError('StringScanner.peek: n must be a number');
    }
    return this._input.slice(this._pos, this._pos + count);
  }

  consume(n: number): string {
    if (typeof n !== 'number' || !isFinite(n)) {
      throw new TypeError('StringScanner.consume: n must be a number');
    }
    if (n < 0) {
      throw new RangeError(`StringScanner.consume: n must be >= 0, got ${n}`);
    }
    const remaining = this._input.length - this._pos;
    if (n > remaining) {
      throw new RangeError(
        `StringScanner.consume: n (${n}) exceeds rest length (${remaining})`
      );
    }
    const consumed = this._input.slice(this._pos, this._pos + n);
    this._pos += n;
    return consumed;
  }

  scan(pattern: RegExp): string | null {
    if (this.isEos()) {
      return null;
    }
    const anchored = this._anchorPattern(pattern);
    const match = anchored.exec(this.rest);
    if (match === null) {
      return null;
    }
    this._pos += match[0].length;
    return match[0];
  }

  scanUntil(pattern: RegExp): string | null {
    const rest = this.rest;
    // Use unanchored pattern to find next occurrence
    const unanchored = this._unanchorPattern(pattern);
    const match = unanchored.exec(rest);
    if (match === null) {
      return null;
    }
    const skipped = rest.slice(0, match.index);
    this._pos += match.index;
    return skipped;
  }

  check(pattern: RegExp): string | null {
    if (this.isEos()) {
      return null;
    }
    const anchored = this._anchorPattern(pattern);
    const match = anchored.exec(this.rest);
    if (match === null) {
      return null;
    }
    return match[0];
  }

  skip(pattern: RegExp): number {
    const matched = this.scan(pattern);
    if (matched === null) {
      return 0;
    }
    return matched.length;
  }

  saveState(): number {
    return this._pos;
  }

  restoreState(bookmark: number): void {
    if (typeof bookmark !== 'number' || !isFinite(bookmark)) {
      throw new TypeError('StringScanner.restoreState: bookmark must be a number');
    }
    if (bookmark < 0 || bookmark > this._input.length || !Number.isInteger(bookmark)) {
      throw new RangeError(
        `StringScanner.restoreState: bookmark (${bookmark}) is not a valid position`
      );
    }
    this._pos = bookmark;
  }

  gotoPos(pos: number): void {
    if (typeof pos !== 'number' || !isFinite(pos)) {
      throw new TypeError('StringScanner.gotoPos: pos must be a number');
    }
    if (pos < 0 || pos > this._input.length || !Number.isInteger(pos)) {
      throw new RangeError(
        `StringScanner.gotoPos: pos (${pos}) is out of bounds [0, ${this._input.length}]`
      );
    }
    this._pos = pos;
  }

  private _anchorPattern(pattern: RegExp): RegExp {
    const source = pattern.source;
    const flags = pattern.flags;
    // Remove existing ^ anchor if present, then re-add it
    const anchored = source.startsWith('^') ? source : `^(?:${source})`;
    return new RegExp(anchored, flags);
  }

  private _unanchorPattern(pattern: RegExp): RegExp {
    // Return pattern without ^ anchor, preserving flags
    const source = pattern.source;
    const flags = pattern.flags;
    // Remove leading ^ if present to ensure we search anywhere in string
    const unanchored = source.startsWith('^') ? source.slice(1) : source;
    return new RegExp(unanchored, flags);
  }
}