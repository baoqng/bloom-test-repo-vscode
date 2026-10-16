// bloom-deps:

export function validateOverheadBudget(totalOverhead: number, lifetimeMs: number): void {
  if (typeof totalOverhead !== 'number' || !isFinite(totalOverhead) || totalOverhead < 0) {
    throw new TypeError('totalOverhead must be a non-negative finite number');
  }

  if (typeof lifetimeMs !== 'number' || !isFinite(lifetimeMs) || lifetimeMs <= 0) {
    throw new TypeError('lifetimeMs must be a positive finite number');
  }

  if (totalOverhead >= lifetimeMs) {
    throw new RangeError('totalOverhead must be less than lifetimeMs');
  }
}