export class TtlCache<T> {
  private readonly ttl: number;
  private readonly cache: Map<string, { value: T; expiry: number }>;

  constructor(ttl: number) {
    this.ttl = ttl;
    this.cache = new Map();
  }

  set(key: string, value: T): void {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() >= entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }
}