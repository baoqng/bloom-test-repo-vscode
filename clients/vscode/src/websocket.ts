// bloom-deps:

export function resolveNextPollInterval(
  status: string,
  elapsedMs: number,
  lastPollIntervalMs: number
): number {
  if (typeof status !== 'string') {
    throw new TypeError('status must be a string');
  }

  if (
    typeof elapsedMs !== 'number' ||
    !Number.isFinite(elapsedMs)
  ) {
    throw new TypeError('elapsedMs must be a finite number');
  }

  if (
    typeof lastPollIntervalMs !== 'number' ||
    !Number.isFinite(lastPollIntervalMs)
  ) {
    throw new TypeError('lastPollIntervalMs must be a finite number');
  }

  if (elapsedMs < 0) {
    throw new RangeError('elapsedMs must not be negative');
  }

  if (lastPollIntervalMs < 0) {
    throw new RangeError('lastPollIntervalMs must not be negative');
  }

  const TERMINAL_STATUSES = new Set(['complete', 'failed', 'partial_complete']);

  if (TERMINAL_STATUSES.has(status)) {
    return 0;
  }

  if (status === 'pending_enrichment_review') {
    return 0;
  }

  const ELAPSED_TIMEOUT_MS = 600000;
  const SLOW_POLL_MS = 60000;
  const INITIAL_INTERVAL_MS = 5000;
  const MAX_INTERVAL_MS = 30000;

  if (elapsedMs > ELAPSED_TIMEOUT_MS) {
    return SLOW_POLL_MS;
  }

  if (lastPollIntervalMs === 0) {
    return INITIAL_INTERVAL_MS;
  }

  return Math.min(lastPollIntervalMs * 2, MAX_INTERVAL_MS);
}