// bloom-deps:

export type HttpHeaders = Record<string, string | string[] | undefined>;

function readHeader(headers: HttpHeaders, name: string): string | undefined {
  if (headers == null || typeof headers !== 'object') {
    return undefined;
  }
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) {
      const val = headers[key];
      if (Array.isArray(val)) {
        return val[0];
      }
      return val;
    }
  }
  return undefined;
}

export function retryAfterFromRateLimitHeaders(
  headers: HttpHeaders,
  now: () => number = Date.now
): number | undefined {
  if (headers === null || headers === undefined) {
    throw new TypeError('headers must be a non-null object');
  }
  if (typeof headers !== 'object') {
    throw new TypeError('headers must be an object');
  }
  if (typeof now !== 'function') {
    throw new TypeError('now must be a function');
  }

  // (1) Check Retry-After header
  const retryAfterRaw = readHeader(headers, 'retry-after');
  if (retryAfterRaw !== undefined && retryAfterRaw !== null) {
    const parsed = parseInt(retryAfterRaw, 10);
    if (!Number.isFinite(parsed) || isNaN(parsed)) {
      return undefined;
    }
    return parsed * 1000;
  }

  // (2) Check x-ratelimit-remaining and x-ratelimit-reset
  const remainingRaw = readHeader(headers, 'x-ratelimit-remaining');
  const resetRaw = readHeader(headers, 'x-ratelimit-reset');

  if (remainingRaw === '0' && resetRaw !== undefined && resetRaw !== null) {
    const resetParsed = parseInt(resetRaw, 10);
    if (!Number.isFinite(resetParsed) || isNaN(resetParsed)) {
      return undefined;
    }
    let nowMs: number;
    try {
      nowMs = now();
    } catch {
      return undefined;
    }
    return Math.max(0, resetParsed * 1000 - nowMs);
  }

  return undefined;
}