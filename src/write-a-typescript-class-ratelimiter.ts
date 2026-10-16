export interface RateLimiterOptions {
  maxTokens: number;
  refillRatePerMs: number;
  initialTokens?: number;
}

function validateTokensArg(tokens: number): void {
  if (
    typeof tokens !== 'number' ||
    !Number.isFinite(tokens) ||
    !Number.isInteger(tokens) ||
    tokens <= 0
  ) {
    throw new TypeError(
      `tokens must be a positive finite integer, got: ${tokens}`
    );
  }
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

    if (
      typeof maxTokens !== 'number' ||
      !Number.isFinite(maxTokens) ||
      !Number.isInteger(maxTokens) ||
      maxTokens <= 0
    ) {
      throw new TypeError(
        `maxTokens must be a positive integer, got: ${maxTokens}`
      );
    }

    if (
      typeof refillRatePerMs !== 'number' ||
      !Number.isFinite(refillRatePerMs) ||
      refillRatePerMs <= 0
    ) {
      throw new TypeError(
        `refillRatePerMs must be a positive finite number, got: ${refillRatePerMs}`
      );
    }

    this.maxTokens = maxTokens;
    this.refillRatePerMs = refillRatePerMs;

    let startTokens = maxTokens;
    if (initialTokens !== undefined) {
      if (typeof initialTokens !== 'number' || !Number.isFinite(initialTokens)) {
        throw new TypeError(
          `initialTokens must be a finite number, got: ${initialTokens}`
        );
      }
      startTokens = Math.max(0, Math.min(maxTokens, initialTokens));
    }

    this.currentTokens = startTokens;
    this.lastRefillTimeMs = Date.now();
  }

  private refill(nowMs: number): void {
    const elapsed = Math.max(0, nowMs - this.lastRefillTimeMs);
    this.currentTokens = Math.min(
      this.maxTokens,
      this.currentTokens + elapsed * this.refillRatePerMs
    );
    this.lastRefillTimeMs = nowMs;
  }

  tryConsume(tokens: number, nowMs?: number): boolean {
    validateTokensArg(tokens);

    const now = nowMs !== undefined ? nowMs : Date.now();

    this.refill(now);

    if (this.currentTokens >= tokens) {
      this.currentTokens -= tokens;
      return true;
    }

    return false;
  }

  availableAt(tokens: number, nowMs?: number): number {
    validateTokensArg(tokens);

    if (tokens > this.maxTokens) {
      throw new TypeError(
        `tokens (${tokens}) exceeds maxTokens (${this.maxTokens}) and can never be satisfied`
      );
    }

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