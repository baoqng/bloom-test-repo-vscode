// bloom-deps:

export function computeRefreshDeadline(
  issuedAtMs: number,
  lifetimeSeconds: number,
  requestTimeoutMs: number,
  safetyMarginMs: number
): number {
  // Validate all arguments are finite numbers
  if (typeof issuedAtMs !== 'number' || !Number.isFinite(issuedAtMs)) {
    throw new TypeError('issuedAtMs must be a finite number');
  }
  if (typeof lifetimeSeconds !== 'number' || !Number.isFinite(lifetimeSeconds)) {
    throw new TypeError('lifetimeSeconds must be a finite number');
  }
  if (typeof requestTimeoutMs !== 'number' || !Number.isFinite(requestTimeoutMs)) {
    throw new TypeError('requestTimeoutMs must be a finite number');
  }
  if (typeof safetyMarginMs !== 'number' || !Number.isFinite(safetyMarginMs)) {
    throw new TypeError('safetyMarginMs must be a finite number');
  }

  // Validate lifetimeSeconds is positive
  if (lifetimeSeconds <= 0) {
    throw new RangeError('lifetimeSeconds must be a positive number');
  }

  // Validate requestTimeoutMs is not negative
  if (requestTimeoutMs < 0) {
    throw new RangeError('requestTimeoutMs must not be negative');
  }

  // Validate safetyMarginMs is not negative
  if (safetyMarginMs < 0) {
    throw new RangeError('safetyMarginMs must not be negative');
  }

  // Validate that overhead does not exceed lifetime
  const lifetimeMs = lifetimeSeconds * 1000;
  const totalOverhead = requestTimeoutMs + safetyMarginMs;
  if (totalOverhead >= lifetimeMs) {
    throw new RangeError(
      'requestTimeoutMs + safetyMarginMs must not exceed lifetimeSeconds * 1000'
    );
  }

  // Compute deadline: issuedAtMs + lifetimeSeconds * 1000 - requestTimeoutMs - safetyMarginMs
  const deadline = issuedAtMs + lifetimeMs - requestTimeoutMs - safetyMarginMs;

  // If computed deadline is less than or equal to issuedAtMs, return issuedAtMs
  if (deadline <= issuedAtMs) {
    return issuedAtMs;
  }

  return deadline;
}