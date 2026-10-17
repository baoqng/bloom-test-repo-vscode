// bloom-deps:

export class ReadBuffer {
  private _data: Uint8Array;
  private _position: number;

  constructor(data: Uint8Array) {
    this._data = data;
    this._position = 0;
  }

  read(length: number): Uint8Array {
    if (length < 0) {
      throw new RangeError(`Length must be non-negative, got ${length}`);
    }
    if (length > this.remaining) {
      throw new RangeError(`Cannot read ${length} bytes; only ${this.remaining} bytes remaining`);
    }
    const result = this._data.slice(this._position, this._position + length);
    this._position += length;
    return result;
  }

  peek(length: number): Uint8Array {
    if (length < 0) {
      throw new RangeError(`Length must be non-negative, got ${length}`);
    }
    if (length > this.remaining) {
      throw new RangeError(`Cannot peek ${length} bytes; only ${this.remaining} bytes remaining`);
    }
    return this._data.slice(this._position, this._position + length);
  }

  seek(position: number): void {
    if (position < 0) {
      throw new RangeError(`Position must be non-negative, got ${position}`);
    }
    if (position > this._data.length) {
      throw new RangeError(`Position ${position} exceeds buffer length ${this._data.length}`);
    }
    this._position = position;
  }

  get position(): number {
    return this._position;
  }

  get remaining(): number {
    return this._data.length - this._position;
  }

  get length(): number {
    return this._data.length;
  }
}