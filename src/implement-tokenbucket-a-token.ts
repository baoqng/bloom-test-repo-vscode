// bloom-deps:

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly initialTokens: number;
  private readonly clock: () => number;

  private tokens: number;
  private lastRefillTime: number;

  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0) {
      throw new RangeError('capacity must be > 0');
    }
    if (options.refillRate <= 0) {
      throw new RangeError('refillRate must be > 0');
    }

    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
    this.clock = options.now ?? (() => Date.now());

    const initial = options.initialTokens !== undefined ? options.initialTokens : options.capacity;
    this.initialTokens = Math.min(initial, options.capacity);
    this.tokens = this.initialTokens;
    this.lastRefillTime = this.clock();
  }

  private computeAvailable(): number {
    const now = this.clock();
    const elapsed = Math.max(0, now - this.lastRefillTime) / 1000;
    const added = elapsed * this.refillRate;
    const updated = Math.min(this.capacity, this.tokens + added);
    this.tokens = updated;
    this.lastRefillTime = now;
    return this.tokens;
  }

  tryConsume(tokens: number = 1): boolean {
    if (tokens === 0) {
      return true;
    }

    const available = this.computeAvailable();
    if (Math.floor(available) >= tokens) {
      this.tokens = available - tokens;
      return true;
    }
    return false;
  }

  consume(tokens: number = 1): Promise<void> {
    if (tokens > this.capacity) {
      return Promise.reject(new RangeError('cannot consume more than capacity'));
    }

    return new Promise<void>((resolve) => {
      const attempt = () => {
        const available = this.computeAvailable();
        if (Math.floor(available) >= tokens) {
          this.tokens = available - tokens;
          resolve();
        } else {
          const needed = tokens - available;
          const waitMs = (needed / this.refillRate) * 1000;
          setTimeout(attempt, Math.max(1, waitMs));
        }
      };
      attempt();
    });
  }

  waitTime(tokens: number = 1): number {
    const available = this.computeAvailable();
    if (Math.floor(available) >= tokens) {
      return 0;
    }
    const needed = tokens - available;
    return (needed / this.refillRate) * 1000;
  }

  availableTokens(): number {
    const available = this.computeAvailable();
    return Math.floor(available);
  }

  refill(tokens: number): void {
    const available = this.computeAvailable();
    this.tokens = Math.min(this.capacity, available + tokens);
  }

  reset(): void {
    this.tokens = this.initialTokens;
    this.lastRefillTime = this.clock();
  }
}

interface TokenBucketOptions {
  capacity: number;
  refillRate: number;
  initialTokens?: number;
  now?: () => number;
}