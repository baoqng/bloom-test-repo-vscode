export interface RateLimiterOptions {
  maxTokens: number;
  refillRatePerMs: number;
  initialTokens?: number;
}

export class RateLimiter {
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;
  private currentTokens: number;
  private lastRefillTimeMs: number;

  constructor(options: RateLimiterOptions) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('options must be a non-null object');
    }

    const { maxTokens, refillRatePerMs, initialTokens } = options;

    if (typeof maxTokens !== 'number' || !isFinite(maxTokens) || maxTokens <= 0 || !Number.isInteger(maxTokens)) {
      throw new TypeError('maxTokens must be a positive finite integer');
    }

    if (typeof refillRatePerMs !== 'number' || !isFinite(refillRatePerMs) || refillRatePerMs <= 0) {
      throw new TypeError('refillRatePerMs must be a positive finite number');
    }

    this.maxTokens = maxTokens;
    this.refillRatePerMs = refillRatePerMs;

    if (initialTokens === undefined) {
      this.currentTokens = maxTokens;
    } else {
      this.currentTokens = Math.min(Math.max(0, initialTokens), maxTokens);
    }

    this.lastRefillTimeMs = Date.now();
  }

  private validateTokens(tokens: number): void {
    if (
      typeof tokens !== 'number' ||
      !isFinite(tokens) ||
      tokens <= 0 ||
      !Number.isInteger(tokens)
    ) {
      throw new TypeError('tokens must be a positive finite integer');
    }
  }

  private refill(nowMs: number): void {
    const elapsed = nowMs - this.lastRefillTimeMs;
    if (elapsed > 0) {
      this.currentTokens = Math.min(
        this.maxTokens,
        this.currentTokens + elapsed * this.refillRatePerMs
      );
      this.lastRefillTimeMs = nowMs;
    }
  }

  tryConsume(tokens: number, nowMs?: number): boolean {
    this.validateTokens(tokens);

    const now = nowMs !== undefined ? nowMs : Date.now();

    // On the very first call with an explicit nowMs, anchor lastRefillTimeMs
    // so that elapsed time is computed relative to the provided timestamp.
    if (nowMs !== undefined && this.lastRefillTimeMs !== nowMs) {
      // If this is effectively the first interaction (tokens are still full),
      // or if the provided time is before our lastRefillTimeMs, re-anchor.
      if (nowMs < this.lastRefillTimeMs) {
        this.lastRefillTimeMs = nowMs;
      }
    }

    this.refill(now);

    if (this.currentTokens >= tokens) {
      this.currentTokens -= tokens;
      return true;
    }

    return false;
  }

  availableAt(tokens: number, nowMs?: number): number {
    this.validateTokens(tokens);

    const now = nowMs !== undefined ? nowMs : Date.now();

    if (nowMs !== undefined && nowMs < this.lastRefillTimeMs) {
      this.lastRefillTimeMs = nowMs;
    }

    this.refill(now);

    if (this.currentTokens >= tokens) {
      return now;
    }

    const deficit = tokens - this.currentTokens;
    const msNeeded = deficit / this.refillRatePerMs;

    return now + msNeeded;
  }

  reset(nowMs?: number): void {
    const now = nowMs !== undefined ? nowMs : Date.now();
    this.currentTokens = this.maxTokens;
    this.lastRefillTimeMs = now;
  }
}