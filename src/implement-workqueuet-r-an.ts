// bloom-deps:

type WorkerFn<T, R> = (item: T) => Promise<R>;

interface WorkQueueOptions {
  maxConcurrent: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface QueueEntry<T, R> {
  item: T;
  resolve: (value: R) => void;
  reject: (reason: unknown) => void;
}

export class WorkQueue<T, R> {
  private readonly _worker: WorkerFn<T, R>;
  private readonly _maxConcurrent: number;
  private readonly _maxRetries: number;
  private readonly _retryDelay: number;

  private _queue: QueueEntry<T, R>[] = [];
  private _running: number = 0;
  private _paused: boolean = false;
  private _drainResolvers: (() => void)[] = [];

  constructor(worker: WorkerFn<T, R>, options: WorkQueueOptions) {
    if (options.maxConcurrent < 1) {
      throw new RangeError('maxConcurrent must be at least 1');
    }
    this._worker = worker;
    this._maxConcurrent = options.maxConcurrent;
    this._maxRetries = options.maxRetries ?? 0;
    this._retryDelay = options.retryDelay ?? 0;
  }

  get size(): number {
    return this._queue.length + this._running;
  }

  get pending(): number {
    return this._queue.length;
  }

  get running(): number {
    return this._running;
  }

  enqueue(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this._queue.push({ item, resolve, reject });
      this._tick();
    });
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    if (!this._paused) {
      return;
    }
    this._paused = false;
    this._tick();
  }

  drain(): Promise<void> {
    if (this.size === 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this._drainResolvers.push(resolve);
    });
  }

  clear(): void {
    const pending = this._queue.splice(0);
    for (const entry of pending) {
      entry.reject(new Error('queue cleared'));
    }
    this._checkDrain();
  }

  private _tick(): void {
    if (this._paused) {
      return;
    }
    while (this._running < this._maxConcurrent && this._queue.length > 0) {
      const entry = this._queue.shift()!;
      this._running++;
      this._runEntry(entry);
    }
  }

  private _runEntry(entry: QueueEntry<T, R>): void {
    this._executeWithRetry(entry.item, 0)
      .then(
        (result) => {
          entry.resolve(result);
        },
        (err) => {
          entry.reject(err);
        }
      )
      .finally(() => {
        this._running--;
        this._checkDrain();
        this._tick();
      });
  }

  private _executeWithRetry(item: T, attempt: number): Promise<R> {
    return this._worker(item).then(
      (result) => result,
      (err) => {
        if (attempt < this._maxRetries) {
          const delay = this._retryDelay;
          if (delay > 0) {
            return new Promise<R>((resolve, reject) => {
              setTimeout(() => {
                this._executeWithRetry(item, attempt + 1).then(resolve, reject);
              }, delay);
            });
          }
          return this._executeWithRetry(item, attempt + 1);
        }
        return Promise.reject(err);
      }
    );
  }

  private _checkDrain(): void {
    if (this.size === 0 && this._drainResolvers.length > 0) {
      const resolvers = this._drainResolvers.splice(0);
      for (const resolve of resolvers) {
        resolve();
      }
    }
  }
}