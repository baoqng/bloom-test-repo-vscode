export class SlidingWindowRateLimiter {
	private readonly limit: number;
	private readonly windowMs: number;
	private readonly burstLimit: number;
	private readonly keyFn?: () => string;
	private readonly clock: { now(): number; setTimeout(fn: () => void, ms: number): unknown; clearTimeout(id: unknown): void };

	private readonly timestamps: Map<string, number[]> = new Map();
	private readonly stats: Map<string, { total: number; allowed: number; denied: number }> = new Map();
	private readonly waiters: Map<string, Array<() => void>> = new Map();
	private readonly timeoutIds: Map<string, unknown> = new Map();

	constructor(options: {
		limit: number;
		windowMs: number;
		burstLimit?: number;
		keyFn?: () => string;
		clock?: { now(): number; setTimeout(fn: () => void, ms: number): unknown; clearTimeout(id: unknown): void };
	}) {
		if (!Number.isFinite(options.limit)) {
			throw new TypeError('limit must be a finite number');
		}
		if (!Number.isFinite(options.windowMs)) {
			throw new TypeError('windowMs must be a finite number');
		}
		if (options.limit < 1) {
			throw new RangeError('limit must be at least 1');
		}
		if (options.windowMs < 1) {
			throw new RangeError('windowMs must be at least 1');
		}

		this.limit = options.limit;
		this.windowMs = options.windowMs;
		this.burstLimit = options.burstLimit ?? 0;
		this.keyFn = options.keyFn;
		this.clock = options.clock ?? {
			now: () => Date.now(),
			setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
			clearTimeout: (id) => globalThis.clearTimeout(id as number),
		};
	}

	private resolveKey(key?: string): string {
		if (key !== undefined) {
			return key;
		}
		if (this.keyFn) {
			return this.keyFn();
		}
		return 'default';
	}

	private getOrCreateStats(key: string): { total: number; allowed: number; denied: number } {
		if (!this.stats.has(key)) {
			this.stats.set(key, { total: 0, allowed: 0, denied: 0 });
		}
		return this.stats.get(key)!;
	}

	private pruneTimestamps(key: string, now: number): void {
		const list = this.timestamps.get(key);
		if (!list) return;

		const cutoff = now - this.windowMs;
		let i = 0;
		while (i < list.length && list[i] < cutoff) {
			i++;
		}
		if (i > 0) {
			list.splice(0, i);
		}
		if (list.length === 0) {
			this.timestamps.delete(key);
		}
	}

	tryAcquire(key?: string): boolean {
		const resolvedKey = this.resolveKey(key);
		const now = this.clock.now();

		this.pruneTimestamps(resolvedKey, now);

		const list = this.timestamps.get(resolvedKey) ?? [];
		const stats = this.getOrCreateStats(resolvedKey);
		stats.total++;

		if (list.length < this.limit + this.burstLimit) {
			if (!this.timestamps.has(resolvedKey)) {
				this.timestamps.set(resolvedKey, []);
			}
			this.timestamps.get(resolvedKey)!.push(now);
			stats.allowed++;
			return true;
		}

		stats.denied++;
		return false;
	}

	acquire(key?: string): Promise<void> {
		const resolvedKey = this.resolveKey(key);

		if (this.tryAcquire(resolvedKey)) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve) => {
			if (!this.waiters.has(resolvedKey)) {
				this.waiters.set(resolvedKey, []);
			}
			this.waiters.get(resolvedKey)!.push(resolve);
			this.scheduleWaiterProcessing(resolvedKey);
		});
	}

	private scheduleWaiterProcessing(key: string): void {
		if (this.timeoutIds.has(key)) {
			return;
		}

		const now = this.clock.now();
		const resetTime = this.resetTime(key);

		if (resetTime <= now) {
			this.processWaiters(key);
			return;
		}

		const delay = resetTime - now;
		const id = this.clock.setTimeout(() => {
			this.timeoutIds.delete(key);
			this.processWaiters(key);
		}, delay);

		this.timeoutIds.set(key, id);
	}

	private processWaiters(key: string): void {
		const waiters = this.waiters.get(key);
		if (!waiters || waiters.length === 0) {
			return;
		}

		while (waiters.length > 0) {
			if (this.tryAcquire(key)) {
				const waiter = waiters.shift()!;
				waiter();
			} else {
				break;
			}
		}

		if (waiters.length > 0) {
			this.scheduleWaiterProcessing(key);
		} else {
			this.waiters.delete(key);
		}
	}

	remaining(key?: string): number {
		const resolvedKey = this.resolveKey(key);
		const now = this.clock.now();

		this.pruneTimestamps(resolvedKey, now);

		const list = this.timestamps.get(resolvedKey) ?? [];
		return Math.max(0, this.limit + this.burstLimit - list.length);
	}

	resetTime(key?: string): number {
		const resolvedKey = this.resolveKey(key);
		const list = this.timestamps.get(resolvedKey);

		if (!list || list.length === 0) {
			return this.clock.now();
		}

		const oldestTimestamp = list[0];
		return oldestTimestamp + this.windowMs;
	}

	reset(key?: string): void {
		if (key === undefined) {
			this.timestamps.clear();
			this.timeoutIds.forEach((id) => this.clock.clearTimeout(id));
			this.timeoutIds.clear();
			this.waiters.forEach((waiters) => {
				waiters.forEach((resolve) => resolve());
			});
			this.waiters.clear();
		} else {
			const resolvedKey = this.resolveKey(key);
			this.timestamps.delete(resolvedKey);
			const id = this.timeoutIds.get(resolvedKey);
			if (id !== undefined) {
				this.clock.clearTimeout(id);
				this.timeoutIds.delete(resolvedKey);
			}
			const waiters = this.waiters.get(resolvedKey);
			if (waiters) {
				waiters.forEach((resolve) => resolve());
				this.waiters.delete(resolvedKey);
			}
		}
	}

	getStats(key?: string): { total: number; allowed: number; denied: number } {
		const resolvedKey = this.resolveKey(key);
		const stat = this.stats.get(resolvedKey);
		if (!stat) {
			return { total: 0, allowed: 0, denied: 0 };
		}
		return { ...stat };
	}
}