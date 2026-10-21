// bloom-deps:

export interface TokenBucketOptions {
  capacity: number;
  refillRate: number;
  initialTokens?: number;
  now?: () => number;
}

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly initialTokens: number;
  private readonly now: () => number;

  private tokens: number;
  private lastRefillTime: number;
  private pendingConsumers: Array<{
    tokensNeeded: number;
    resolve: () => void;
  }> = [];

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0) {
      throw new RangeError('capacity must be greater than 0');
    }
    if (options.refillRate <= 0) {
      throw new RangeError('refillRate must be greater than 0');
    }

    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.now = options.now ?? (() => Date.now());

    let initial = options.initialTokens ?? options.capacity;
    if (initial > options.capacity) {
      initial = options.capacity;
    }
    this.initialTokens = initial;
    this.tokens = initial;
    this.lastRefillTime = this.now();
  }

  private refillTokens(): void {
    const currentTime = this.now();
    const elapsedMs = currentTime - this.lastRefillTime;
    const tokensToAdd = (elapsedMs / 1000) * this.refillRate;

    this.tokens = Math.min(this.tokens + tokensToAdd, this.capacity);
    this.lastRefillTime = currentTime;
  }

  tryConsume(tokens: number = 1): boolean {
    this.refillTokens();

    const availableFloor = Math.floor(this.tokens);

    if (tokens === 0) {
      return true;
    }

    if (availableFloor < tokens) {
      return false;
    }

    this.tokens -= tokens;
    return true;
  }

  async consume(tokens: number = 1): Promise<void> {
    if (tokens > this.capacity) {
      throw new RangeError('cannot consume more than capacity');
    }

    if (this.tryConsume(tokens)) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.pendingConsumers.push({ tokensNeeded: tokens, resolve });
      this.processPendingConsumers();
    });
  }

  private processPendingConsumers(): void {
    const remaining: Array<{
      tokensNeeded: number;
      resolve: () => void;
    }> = [];

    for (const consumer of this.pendingConsumers) {
      if (this.tryConsume(consumer.tokensNeeded)) {
        consumer.resolve();
      } else {
        remaining.push(consumer);
      }
    }

    this.pendingConsumers = remaining;

    if (this.pendingConsumers.length > 0) {
      const nextWaitTime = this.waitTime(this.pendingConsumers[0].tokensNeeded);
      if (nextWaitTime > 0) {
        setTimeout(() => this.processPendingConsumers(), nextWaitTime + 1);
      }
    }
  }

  waitTime(tokens: number = 1): number {
    this.refillTokens();

    const availableFloor = Math.floor(this.tokens);
    if (availableFloor >= tokens) {
      return 0;
    }

    const tokensNeeded = tokens - this.tokens;
    const secondsNeeded = tokensNeeded / this.refillRate;
    const msNeeded = secondsNeeded * 1000;

    return Math.ceil(msNeeded);
  }

  availableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  refill(tokens: number): void {
    this.refillTokens();
    this.tokens = Math.min(this.tokens + tokens, this.capacity);
    this.processPendingConsumers();
  }

  reset(): void {
    this.tokens = this.initialTokens;
    this.lastRefillTime = this.now();
  }
}