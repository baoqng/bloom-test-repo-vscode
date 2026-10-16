// bloom-deps:

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

    if (typeof maxTokens !== 'number' || !Number.isFinite(maxTokens) || !Number.isInteger(maxTokens) || maxTokens <= 0) {
      throw new TypeError('maxTokens must be a positive integer');
    }

    if (typeof refillRatePerMs !== 'number' || !Number.isFinite(refillRatePerMs) || refillRatePerMs <= 0) {
      throw new TypeError('refillRatePerMs must be a positive finite number');
    }

    this.maxTokens = maxTokens;
    this.refillRatePerMs = refillRatePerMs;

    if (initialTokens === undefined) {
      this.currentTokens = maxTokens;
    } else {
      const clamped = Math.max(0, Math.min(maxTokens, initialTokens));
      this.currentTokens = clamped;
    }

    this.lastRefillTimeMs = Date.now();
  }

  private validateTokens(tokens: number): void {
    if (typeof tokens !== 'number' || !Number.isFinite(tokens) || !Number.isInteger(tokens) || tokens <= 0) {
      throw new TypeError('tokens must be a positive finite integer');
    }
  }

  private refill(nowMs: number): void {
    const elapsed = Math.max(0, nowMs - this.lastRefillTimeMs);
    const added = elapsed * this.refillRatePerMs;
    this.currentTokens = Math.min(this.maxTokens, this.currentTokens + added);
    this.lastRefillTimeMs = nowMs;
  }

  tryConsume(tokens: number, nowMs?: number): boolean {
    this.validateTokens(tokens);

    const now = nowMs !== undefined ? nowMs : Date.now();
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