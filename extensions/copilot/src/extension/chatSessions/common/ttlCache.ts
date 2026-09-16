// bloom-deps:

class TtlCache<V> {
	private readonly _entries = new Map<string, { value: V; timestamp: number; ttlMs?: number }>();

	/**
	 * @param _ttlMs The time-to-live in milliseconds for cache entries.
	 */
	constructor(private readonly _ttlMs: number) { }

	/**
	 * Returns the cached value if it exists and has not expired, otherwise `undefined`.
	 */
	get(key: string): V | undefined {
		const entry = this._entries.get(key);
		if (!entry) {
			return undefined;
		}
		const ttl = entry.ttlMs ?? this._ttlMs;
		if (Date.now() - entry.timestamp >= ttl) {
			this._entries.delete(key);
			return undefined;
		}
		return entry.value;
	}

	/**
	 * Stores a value in the cache with the current timestamp.
	 * @param ttlMs Optional per-entry TTL override in milliseconds. If not provided, the cache-wide TTL is used.
	 */
	set(key: string, value: V, ttlMs?: number): void {
		this._entries.set(key, { value, timestamp: Date.now(), ttlMs });
	}

	/**
	 * Removes a single entry from the cache.
	 */
	delete(key: string): void {
		this._entries.delete(key);
	}

	/**
	 * Removes all entries from the cache.
	 */
	clear(): void {
		this._entries.clear();
	}

	/**
	 * Returns `true` if the cache has a non-expired entry for the given key.
	 */
	has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	/**
	 * Iterates all entries, deletes every entry whose TTL has elapsed,
	 * and returns the count of entries deleted.
	 */
	pruneExpired(): number {
		let deletedCount = 0;
		const now = Date.now();
		for (const [key, entry] of this._entries) {
			const effectiveTtl = entry.ttlMs ?? this._ttlMs;
			if (now - entry.timestamp >= effectiveTtl) {
				this._entries.delete(key);
				deletedCount++;
			}
		}
		return deletedCount;
	}
}

export { TtlCache };