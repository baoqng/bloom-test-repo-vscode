// bloom-deps:

export class AsyncSemaphore {
  private _permits: number;
  private _waiters: Array<() => void> = [];

  constructor(permits: number) {
    if (permits < 0) {
      throw new RangeError('permits must be non-negative');
    }
    this._permits = permits;
  }

  acquire(): Promise<void> {
    if (this._permits > 0) {
      this._permits--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this._waiters.push(resolve);
    });
  }

  release(): void {
    if (this._waiters.length > 0) {
      const resolve = this._waiters.shift()!;
      resolve();
    } else {
      this._permits++;
    }
  }

  tryAcquire(): boolean {
    if (this._permits > 0) {
      this._permits--;
      return true;
    }
    return false;
  }

  availablePermits(): number {
    return this._permits;
  }

  get queueLength(): number {
    return this._waiters.length;
  }

  withPermit<T>(fn: () => Promise<T> | T): Promise<T> {
    return this.acquire().then(() => {
      let result: Promise<T> | T;
      try {
        result = fn();
      } catch (err) {
        this.release();
        throw err;
      }
      return Promise.resolve(result).then(
        (value) => {
          this.release();
          return value;
        },
        (err) => {
          this.release();
          throw err;
        }
      );
    });
  }
}