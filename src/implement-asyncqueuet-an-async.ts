// bloom-deps:

export class QueueClosedError extends Error {
  constructor(message = 'Queue is closed') {
    super(message);
    this.name = 'QueueClosedError';
  }
}

export class AsyncQueue<T> {
  static readonly EMPTY: unique symbol = Symbol('AsyncQueue.EMPTY');

  private readonly _capacity: number;
  private readonly _buffer: T[] = [];
  private _closed = false;

  // Waiting producers: each holds the item to enqueue + resolve/reject
  private readonly _waitingProducers: Array<{
    item: T;
    resolve: () => void;
    reject: (err: unknown) => void;
  }> = [];

  // Waiting consumers: each holds resolve/reject for a dequeued item
  private readonly _waitingConsumers: Array<{
    resolve: (item: T) => void;
    reject: (err: unknown) => void;
  }> = [];

  // Waiting drain callers
  private readonly _waitingDrainers: Array<{
    resolve: (items: T[]) => void;
  }> = [];

  constructor(capacity: number) {
    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new RangeError(
        `AsyncQueue capacity must be a finite number >= 1, got ${capacity}`
      );
    }
    this._capacity = capacity;
  }

  get capacity(): number {
    return this._capacity;
  }

  get size(): number {
    return this._buffer.length;
  }

  get isEmpty(): boolean {
    return this._buffer.length === 0;
  }

  get isFull(): boolean {
    return this._buffer.length >= this._capacity;
  }

  enqueue(item: T): Promise<void> {
    if (this._closed) {
      return Promise.reject(new QueueClosedError());
    }

    // If there's a waiting consumer, hand item directly
    if (this._waitingConsumers.length > 0) {
      const consumer = this._waitingConsumers.shift()!;
      consumer.resolve(item);
      return Promise.resolve();
    }

    // If there's a waiting drainer (queue was empty), hand item to drainer
    if (this._waitingDrainers.length > 0 && this._buffer.length === 0) {
      // Add item to buffer then flush to drainer
      this._buffer.push(item);
      this._flushDrainers();
      return Promise.resolve();
    }

    // If there's space, add to buffer
    if (this._buffer.length < this._capacity) {
      this._buffer.push(item);
      return Promise.resolve();
    }

    // Queue is full — suspend producer
    return new Promise<void>((resolve, reject) => {
      this._waitingProducers.push({ item, resolve, reject });
    });
  }

  dequeue(): Promise<T> {
    // If there are items in the buffer, return immediately
    if (this._buffer.length > 0) {
      const item = this._buffer.shift()!;
      this._admitNextProducer();
      return Promise.resolve(item);
    }

    // If closed and empty, reject
    if (this._closed) {
      return Promise.reject(new QueueClosedError());
    }

    // Suspend consumer
    return new Promise<T>((resolve, reject) => {
      this._waitingConsumers.push({ resolve, reject });
    });
  }

  tryEnqueue(item: T): boolean {
    if (this._closed) {
      return false;
    }

    if (this._waitingConsumers.length > 0) {
      const consumer = this._waitingConsumers.shift()!;
      consumer.resolve(item);
      return true;
    }

    if (this._waitingDrainers.length > 0 && this._buffer.length === 0) {
      this._buffer.push(item);
      this._flushDrainers();
      return true;
    }

    if (this._buffer.length < this._capacity) {
      this._buffer.push(item);
      return true;
    }

    return false;
  }

  tryDequeue(): T | typeof AsyncQueue.EMPTY {
    if (this._buffer.length > 0) {
      const item = this._buffer.shift()!;
      this._admitNextProducer();
      return item;
    }
    return AsyncQueue.EMPTY;
  }

  drain(): Promise<T[]> {
    // If there are items, return them all atomically
    if (this._buffer.length > 0) {
      const items = this._buffer.splice(0);
      // Admit as many producers as capacity allows
      this._admitProducersToFillSpace();
      return Promise.resolve(items);
    }

    // If closed and empty, return empty array (remaining items already gone)
    if (this._closed) {
      return Promise.resolve([]);
    }

    // Suspend until at least one item is available
    return new Promise<T[]>((resolve) => {
      this._waitingDrainers.push({ resolve });
    });
  }

  close(): void {
    if (this._closed) {
      return;
    }
    this._closed = true;

    // Reject all waiting producers
    for (const producer of this._waitingProducers) {
      producer.reject(new QueueClosedError());
    }
    this._waitingProducers.length = 0;

    // Resolve waiting consumers with remaining items, then reject the rest
    while (this._waitingConsumers.length > 0 && this._buffer.length > 0) {
      const consumer = this._waitingConsumers.shift()!;
      const item = this._buffer.shift()!;
      consumer.resolve(item);
    }

    // Reject remaining consumers
    for (const consumer of this._waitingConsumers) {
      consumer.reject(new QueueClosedError());
    }
    this._waitingConsumers.length = 0;

    // Resolve waiting drainers
    this._flushDrainers();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      if (this._buffer.length > 0) {
        const item = this._buffer.shift()!;
        this._admitNextProducer();
        yield item;
        continue;
      }

      if (this._closed) {
        return;
      }

      // Wait for next item or close
      try {
        const item = await new Promise<T>((resolve, reject) => {
          this._waitingConsumers.push({ resolve, reject });
        });
        yield item;
      } catch (err) {
        if (err instanceof QueueClosedError) {
          return;
        }
        throw err;
      }
    }
  }

  private _admitNextProducer(): void {
    if (this._waitingProducers.length > 0 && this._buffer.length < this._capacity) {
      const producer = this._waitingProducers.shift()!;
      this._buffer.push(producer.item);
      producer.resolve();
    }
  }

  private _admitProducersToFillSpace(): void {
    while (
      this._waitingProducers.length > 0 &&
      this._buffer.length < this._capacity
    ) {
      const producer = this._waitingProducers.shift()!;
      this._buffer.push(producer.item);
      producer.resolve();
    }
  }

  private _flushDrainers(): void {
    if (this._waitingDrainers.length === 0) {
      return;
    }

    if (this._buffer.length === 0 && !this._closed) {
      return;
    }

    const items = this._buffer.splice(0);
    this._admitProducersToFillSpace();

    for (const drainer of this._waitingDrainers) {
      drainer.resolve(items.slice());
    }
    this._waitingDrainers.length = 0;
  }
}