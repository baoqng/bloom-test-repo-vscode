// bloom-deps:

export class SlidingWindowCounter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private timestamps: number[] = [];

  constructor(windowMs: number, maxRequests: number) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new RangeError(`windowMs must be a positive finite number, got ${windowMs}`);
    }
    if (!Number.isInteger(maxRequests) || maxRequests <= 0) {
      throw new RangeError(`maxRequests must be a positive integer, got ${maxRequests}`);
    }
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private evict(nowMs: number): void {
    const boundary = nowMs - this.windowMs;
    // Keep only timestamps strictly greater than boundary (exclusive lower bound)
    let i = 0;
    while (i < this.timestamps.length && this.timestamps[i] <= boundary) {
      i++;
    }
    if (i > 0) {
      this.timestamps.splice(0, i);
    }
  }

  increment(nowMs?: number): boolean {
    const now = nowMs !== undefined ? nowMs : Date.now();
    this.evict(now);
    this.timestamps.push(now);
    return this.timestamps.length <= this.maxRequests;
  }

  count(nowMs?: number): number {
    const now = nowMs !== undefined ? nowMs : Date.now();
    this.evict(now);
    return this.timestamps.length;
  }

  reset(): void {
    this.timestamps = [];
  }
}