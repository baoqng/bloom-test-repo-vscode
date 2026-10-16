export function buildDeadline(
  issuedAtMs: number,
  lifetimeMs: number,
  requestTimeoutMs: number,
  safetyMarginMs: number
): number {
  if (
    typeof issuedAtMs !== 'number' || !isFinite(issuedAtMs) ||
    typeof lifetimeMs !== 'number' || !isFinite(lifetimeMs) ||
    typeof requestTimeoutMs !== 'number' || !isFinite(requestTimeoutMs) ||
    typeof safetyMarginMs !== 'number' || !isFinite(safetyMarginMs)
  ) {
    throw new RangeError('requestTimeoutMs + safetyMarginMs must not exceed lifetimeSeconds * 1000');
  }

  const totalOverhead = requestTimeoutMs + safetyMarginMs;
  if (totalOverhead > lifetimeMs) {
    throw new RangeError('requestTimeoutMs + safetyMarginMs must not exceed lifetimeSeconds * 1000');
  }

  return issuedAtMs + lifetimeMs - totalOverhead;
}