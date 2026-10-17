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

  private computeRefill(): void {
    const now = this.clock();
    const elapsed = Math.max(0, now - this.lastRefillTime);
    const added = (elapsed / 1000) * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + added);
    this.lastRefillTime = now;
  }

  tryConsume(tokens: number = 1): boolean {
    if (tokens === 0) return true;

    this.computeRefill();

    const available = Math.floor(this.tokens);
    if (available >= tokens) {
      this.tokens -= tokens;
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
        this.computeRefill();
        const available = Math.floor(this.tokens);
        if (available >= tokens) {
          this.tokens -= tokens;
          resolve();
        } else {
          const needed = tokens - this.tokens;
          const waitMs = (needed / this.refillRate) * 1000;
          setTimeout(attempt, Math.max(1, Math.ceil(waitMs)));
        }
      };
      attempt();
    });
  }

  waitTime(tokens: number = 1): number {
    this.computeRefill();
    const available = Math.floor(this.tokens);
    if (available >= tokens) {
      return 0;
    }
    const needed = tokens - this.tokens;
    return Math.ceil((needed / this.refillRate) * 1000);
  }

  availableTokens(): number {
    this.computeRefill();
    return Math.floor(this.tokens);
  }

  refill(tokens: number): void {
    this.computeRefill();
    this.tokens = Math.min(this.capacity, this.tokens + tokens);
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