// bloom-deps:

export function computeTokenExpiry(issuedAtMs: number, lifetimeSeconds: number): number {
  if (typeof issuedAtMs !== 'number' || !Number.isFinite(issuedAtMs)) {
    throw new TypeError('issuedAtMs must be a finite number');
  }
  if (typeof lifetimeSeconds !== 'number' || !Number.isFinite(lifetimeSeconds)) {
    throw new TypeError('lifetimeSeconds must be a finite number');
  }
  if (!Number.isInteger(lifetimeSeconds) || lifetimeSeconds <= 0) {
    throw new RangeError('lifetimeSeconds must be a positive integer');
  }
  if (lifetimeSeconds > 86400) {
    throw new RangeError('lifetimeSeconds must not exceed 86400 (24 hours)');
  }
  return issuedAtMs + lifetimeSeconds * 1000;
}