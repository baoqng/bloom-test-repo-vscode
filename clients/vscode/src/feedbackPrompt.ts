const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true if the given timestamp (milliseconds since epoch) is within
 * the last 24 hours relative to `now` (defaults to Date.now()).
 */
export function isWithinLast24Hours(
  timestampMs: number,
  now: number = Date.now()
): boolean {
  if (typeof timestampMs !== 'number' || !Number.isFinite(timestampMs)) {
    return false;
  }
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    return false;
  }
  return now - timestampMs < TWENTY_FOUR_HOURS_MS && timestampMs <= now;
}

/**
 * Filters an array of items to those whose timestamp field falls within
 * the last 24 hours.
 */
export function filterLast24Hours<T>(
  items: T[],
  getTimestamp: (item: T) => number,
  now: number = Date.now()
): T[] {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }
  if (typeof getTimestamp !== 'function') {
    throw new TypeError('getTimestamp must be a function');
  }
  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError('now must be a finite number');
  }
  return items.filter((item) => {
    const ts = getTimestamp(item);
    return isWithinLast24Hours(ts, now);
  });
}

/**
 * Groups items by a string key, returning a plain object whose values are
 * arrays of matching items.
 */
export function groupBy<T>(
  items: T[],
  getKey: (item: T) => string
): Record<string, T[]> {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }
  if (typeof getKey !== 'function') {
    throw new TypeError('getKey must be a function');
  }
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = getKey(item);
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Returns a re-iterable slice of an iterable, skipping the first `n` elements.
 */
export function skip<T>(iterable: Iterable<T>, n: number): Iterable<T> {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TypeError('n must be a finite number');
  }
  return {
    [Symbol.iterator]() {
      let i = 0;
      return (function* () {
        for (const element of iterable) {
          if (i++ >= n) yield element;
        }
      })();
    },
  };
}

/**
 * Returns a re-iterable that yields at most `n` elements from the source.
 */
export function take<T>(iterable: Iterable<T>, n: number): Iterable<T> {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TypeError('n must be a finite number');
  }
  return {
    [Symbol.iterator]() {
      return (function* () {
        let count = 0;
        for (const element of iterable) {
          if (count++ >= n) break;
          yield element;
        }
      })();
    },
  };
}

/**
 * Returns a re-iterable slice [start, end) of an iterable.
 */
export function slice<T>(
  iterable: Iterable<T>,
  start: number,
  end: number
): Iterable<T> {
  if (typeof start !== 'number' || !Number.isFinite(start)) {
    throw new TypeError('start must be a finite number');
  }
  if (typeof end !== 'number' || !Number.isFinite(end)) {
    throw new TypeError('end must be a finite number');
  }
  return {
    [Symbol.iterator]() {
      return (function* () {
        let i = 0;
        for (const element of iterable) {
          if (i >= end) break;
          if (i >= start) yield element;
          i++;
        }
      })();
    },
  };
}

/**
 * Generates a unique identifier using crypto.randomUUID().
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Transfers `amount` units from the `source` field to the `destination` field
 * on a mutable ledger object, atomically updating both sides.
 */
export function transfer<T extends Record<string, number>>(
  ledger: T,
  source: keyof T & string,
  destination: keyof T & string,
  amount: number
): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError('amount must be a finite number');
  }
  if (amount < 0) {
    throw new Error('amount must be non-negative');
  }
  const sourceBalance = ledger[source];
  if (typeof sourceBalance !== 'number' || sourceBalance < amount) {
    throw new Error(
      `Insufficient balance in \u2018${source}\u2019: has ${sourceBalance}, needs ${amount}`
    );
  }
  (ledger as Record<string, number>)[source] = sourceBalance - amount;
  const destBalance = ledger[destination];
  (ledger as Record<string, number>)[destination] =
    (typeof destBalance === 'number' ? destBalance : 0) + amount;
}