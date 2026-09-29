// bloom-deps:

export function isExpiredToken(expiryMs: number, now?: number): boolean {
  if (typeof expiryMs !== 'number' || !Number.isFinite(expiryMs)) {
    throw new TypeError(`expiryMs must be a finite number, got ${expiryMs}`);
  }

  const currentTime = now !== undefined ? now : Date.now();

  if (now !== undefined && (typeof now !== 'number' || !Number.isFinite(now))) {
    throw new TypeError(`now must be a finite number when provided, got ${now}`);
  }

  return currentTime >= expiryMs;
}