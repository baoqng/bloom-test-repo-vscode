// bloom-deps:

export class RollingStats {
  private readonly windowSize: number;
  private readonly buffer: number[];
  private head: number;
  private _count: number;

  constructor(windowSize: number) {
    if (windowSize < 1) {
      throw new RangeError('windowSize must be >= 1');
    }
    this.windowSize = windowSize;
    this.buffer = new Array(windowSize).fill(0);
    this.head = 0;
    this._count = 0;
  }

  get count(): number {
    return this._count;
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.windowSize;
    if (this._count < this.windowSize) {
      this._count++;
    }
  }

  private getValues(): number[] {
    if (this._count < this.windowSize) {
      return this.buffer.slice(0, this._count);
    }
    // Window is full; reconstruct in order (oldest first)
    const result: number[] = new Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      result[i] = this.buffer[(this.head + i) % this.windowSize];
    }
    return result;
  }

  private assertNotEmpty(): void {
    if (this._count === 0) {
      throw new RangeError('window is empty');
    }
  }

  sum(): number {
    this.assertNotEmpty();
    const values = this.getValues();
    let s = 0;
    for (const v of values) {
      s += v;
    }
    return s;
  }

  mean(): number {
    this.assertNotEmpty();
    return this.sum() / this._count;
  }

  variance(): number {
    this.assertNotEmpty();
    const values = this.getValues();
    const m = this.mean();
    let s = 0;
    for (const v of values) {
      const diff = v - m;
      s += diff * diff;
    }
    return s / this._count;
  }

  stddev(): number {
    this.assertNotEmpty();
    return Math.sqrt(this.variance());
  }

  min(): number {
    this.assertNotEmpty();
    const values = this.getValues();
    let m = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] < m) m = values[i];
    }
    return m;
  }

  max(): number {
    this.assertNotEmpty();
    const values = this.getValues();
    let m = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] > m) m = values[i];
    }
    return m;
  }

  reset(): void {
    this.head = 0;
    this._count = 0;
    this.buffer.fill(0);
  }
}