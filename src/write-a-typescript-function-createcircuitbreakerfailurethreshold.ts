// bloom-deps:

export function createCircuitBreaker(
  failureThreshold: number,
  resetTimeoutMs: number
): {
  canRequest(nowMs: number): boolean;
  recordSuccess(): void;
  recordFailure(nowMs: number): void;
  state(nowMs: number): 'closed' | 'open' | 'half-open';
} {
  if (
    !Number.isInteger(failureThreshold) ||
    failureThreshold <= 0
  ) {
    throw new RangeError('failureThreshold must be a positive integer');
  }

  if (
    typeof resetTimeoutMs !== 'number' ||
    !Number.isFinite(resetTimeoutMs) ||
    resetTimeoutMs <= 0
  ) {
    throw new RangeError('resetTimeoutMs must be a positive finite number');
  }

  type InternalState = 'closed' | 'open' | 'half-open';

  let internalState: InternalState = 'closed';
  let failureCount = 0;
  let openedAt: number | null = null;
  let probeIssued = false;

  function resolveState(nowMs: number): InternalState {
    if (internalState === 'open') {
      if (openedAt !== null && nowMs - openedAt >= resetTimeoutMs) {
        internalState = 'half-open';
        probeIssued = false;
      }
    }
    return internalState;
  }

  return {
    canRequest(nowMs: number): boolean {
      const current = resolveState(nowMs);
      if (current === 'closed') {
        return true;
      }
      if (current === 'open') {
        return false;
      }
      // half-open
      if (!probeIssued) {
        probeIssued = true;
        return true;
      }
      return false;
    },

    recordSuccess(): void {
      if (internalState === 'closed') {
        failureCount = 0;
      } else if (internalState === 'half-open') {
        internalState = 'closed';
        failureCount = 0;
        openedAt = null;
        probeIssued = false;
      }
    },

    recordFailure(nowMs: number): void {
      if (internalState === 'closed') {
        failureCount += 1;
        if (failureCount >= failureThreshold) {
          internalState = 'open';
          openedAt = nowMs;
        }
      } else if (internalState === 'half-open') {
        internalState = 'open';
        openedAt = nowMs;
        probeIssued = false;
      }
    },

    state(nowMs: number): 'closed' | 'open' | 'half-open' {
      return resolveState(nowMs);
    },
  };
}